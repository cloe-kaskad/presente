import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

/** Le modèle : variable CLAUDE_MODEL, un Sonnet récent par défaut. */
export function modele(): string {
  return process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
}

export function claudeDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 30_000 });
  return client;
}

/**
 * Un appel court qui renvoie du JSON validé par un schéma.
 * Ne journalise jamais le contenu (ni la demande, ni la réponse) : seulement le type d'erreur.
 * Renvoie null en cas d'échec : l'appelant a toujours une solution de repli.
 */
export async function demanderJson<S extends z.ZodType>(options: {
  usage: string; // pour les logs, ex. « departage »
  systeme: string;
  message: string;
  schema: S;
  maxTokens?: number;
}): Promise<z.infer<S> | null> {
  if (!claudeDisponible()) return null;
  try {
    const reponse = await getClient().beta.messages.parse({
      model: modele(),
      max_tokens: options.maxTokens ?? 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(options.schema) },
      system: options.systeme,
      messages: [{ role: "user", content: options.message }],
    });
    if (reponse.stop_reason === "refusal") {
      console.warn(`[claude:${options.usage}] refus`);
      return null;
    }
    return (reponse.parsed_output as z.infer<S> | null) ?? null;
  } catch (e) {
    const statut = e instanceof Anthropic.APIError ? e.status : "réseau";
    console.error(`[claude:${options.usage}] échec (${statut})`);
    return null;
  }
}
