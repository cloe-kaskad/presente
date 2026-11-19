import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

/** Le modèle : variable CLAUDE_MODEL, un Sonnet récent par défaut. */
export function modele(): string {
  return process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
}

/** La synthèse « Ce qu'on a compris de toi » demande le meilleur modèle : variable CLAUDE_MODEL_SYNTHESE, Opus par défaut. */
export function modeleSynthese(): string {
  return process.env.CLAUDE_MODEL_SYNTHESE || "claude-opus-5-5";
}

export function claudeDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // La synthèse de la carte peut prendre plus d'une minute : on laisse 2 minutes par appel.
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: 120_000 });
  return client;
}

export type Appel<T> = { ok: true; data: T; ms: number } | { ok: false; raison: string; ms: number };

/**
 * Un appel qui renvoie du JSON validé par un schéma, ou la raison de l'échec.
 * Ne journalise jamais le contenu (ni la demande, ni la réponse) : seulement le type d'erreur.
 */
export async function appelerJson<S extends z.ZodType>(options: {
  usage: string; // pour les logs, ex. « departage »
  systeme: string;
  message: string;
  schema: S;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  modele?: string; // sinon CLAUDE_MODEL
}): Promise<Appel<z.infer<S>>> {
  const debut = Date.now();
  const echec = (raison: string): Appel<z.infer<S>> => {
    console.error(`[claude:${options.usage}] échec : ${raison}`);
    return { ok: false, raison, ms: Date.now() - debut };
  };
  if (!claudeDisponible()) return echec("pas de clé ANTHROPIC_API_KEY");

  const effort = options.effort ?? "low";
  const system = [{ type: "text" as const, text: options.systeme, cache_control: { type: "ephemeral" as const } }];
  const messages = [{ role: "user" as const, content: options.message }];
  const max_tokens = options.maxTokens ?? 16000;

  // Premier essai : avec le relais automatique vers un autre modèle en cas de refus (bêta).
  // Si le compte n'y a pas accès (erreur 400), on réessaie aussitôt sans.
  const avecRelais = () =>
    getClient().beta.messages.parse({
      model: options.modele ?? modele(),
      max_tokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort, format: betaZodOutputFormat(options.schema) },
      system,
      messages,
    });
  const sansRelais = () =>
    getClient().messages.parse({
      model: options.modele ?? modele(),
      max_tokens,
      output_config: { effort, format: zodOutputFormat(options.schema) },
      system,
      messages,
    });

  const lire = (reponse: { stop_reason: string | null; parsed_output?: unknown }): Appel<z.infer<S>> => {
    if (reponse.stop_reason === "refusal") return echec("refus du modèle");
    if (reponse.stop_reason === "max_tokens") return echec("réponse coupée (max_tokens)");
    if (!reponse.parsed_output) return echec("réponse illisible");
    return { ok: true, data: reponse.parsed_output as z.infer<S>, ms: Date.now() - debut };
  };
  const raisonDe = (e: unknown): string => {
    if (e instanceof Anthropic.APIConnectionTimeoutError) return "délai dépassé";
    // Le message d'erreur de l'API ne contient pas ses réponses : on peut le garder.
    if (e instanceof Anthropic.APIError) return `erreur ${e.status ?? "?"} : ${String(e.message).slice(0, 300)}`;
    return `réseau : ${e instanceof Error ? e.message.slice(0, 200) : "inconnue"}`;
  };

  try {
    return lire(await avecRelais());
  } catch (e) {
    if (!(e instanceof Anthropic.BadRequestError)) return echec(raisonDe(e));
    console.warn(`[claude:${options.usage}] relais refusé (${raisonDe(e)}), nouvel essai sans`);
  }
  try {
    return lire(await sansRelais());
  } catch (e) {
    return echec(raisonDe(e));
  }
}

/** Comme appelerJson, mais renvoie null en cas d'échec : l'appelant a sa solution de repli. */
export async function demanderJson<S extends z.ZodType>(options: Parameters<typeof appelerJson<S>>[0]): Promise<z.infer<S> | null> {
  const r = await appelerJson(options);
  return r.ok ? r.data : null;
}
