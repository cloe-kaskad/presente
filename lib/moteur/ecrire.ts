import "server-only";
import { z } from "zod";
import { appelerJson, claudeDisponible } from "@/lib/ia/claude";
import { promptEcriture, promptVerification } from "./prompts";
import { LONGUEUR_ATTENDUE, verifierRegles, type Emplacement } from "./regles";

/**
 * Écrire un texte simple pour elle (hors carte) : le journal, les textes « avant », les introductions,
 * le palier. Mêmes garde-fous que la carte : règles automatiques, seconde passe, un second essai
 * avec la raison du refus. Rien de ce qu'elle a écrit n'apparaît dans les logs.
 */

export type ResultatEcriture =
  | { statut: "ok"; texte: string }
  | { statut: "secours"; raison: string }
  | { statut: "detresse" };

const SchemaTexte = z.object({ statut: z.enum(["ok", "detresse"]), texte: z.string() });
const SchemaVerdict = z.object({
  verdict: z.enum(["ok", "ko"]),
  regle: z.number().int().nullable(),
  raison: z.string().nullable(),
});

const sansTiret = (t: string) => t.trim().replace(/\s*[—–]\s*/g, ", ");

export async function ecrireTexte(options: {
  emplacement: Emplacement;
  /** Ce que le moteur reçoit (emplacement, semaine, quête, contenu, ses réponses…). */
  entree: Record<string, unknown>;
  /** Ses mots, mot pour mot : toute citation doit s'y trouver. */
  sources: string[];
  sujetsAEviter: string | null | undefined;
  citationsMax?: number;
}): Promise<ResultatEcriture> {
  const { emplacement } = options;
  if (!claudeDisponible()) return { statut: "secours", raison: "pas de clé ANTHROPIC_API_KEY" };

  const base = {
    emplacement,
    longueur_attendue: LONGUEUR_ATTENDUE[emplacement],
    sujets_a_eviter: options.sujetsAEviter?.trim() || "aucun",
    ...options.entree,
  };
  let refus: { texte: string; raison: string } | null = null;
  let raison = "inconnue";

  for (let essai = 1; essai <= 2; essai++) {
    const message = JSON.stringify(
      refus
        ? {
            ...base,
            essai_precedent_refuse: {
              ...refus,
              consigne:
                "Réécris le texte en corrigeant ce point. Toute citation entre guillemets doit reprendre ses mots exacts. Dans le doute, n'en mets pas.",
            },
          }
        : base,
    );
    const a = await appelerJson({ usage: emplacement, systeme: promptEcriture(), message, schema: SchemaTexte });
    if (!a.ok) return { statut: "secours", raison: `écriture : ${a.raison}` };
    if (a.data.statut === "detresse") return { statut: "detresse" };
    const texte = sansTiret(a.data.texte);

    const r = verifierRegles(emplacement, [texte], options.sources, options.sujetsAEviter, options.citationsMax ?? 2);
    if (!r.ok) {
      raison = `règle ${r.regle} : ${r.raison}`;
      console.warn(`[moteur:${emplacement}] essai ${essai}, ${raison}`);
      refus = { texte, raison: r.raison };
      continue;
    }

    const v = await appelerJson({
      usage: `verif:${emplacement}`,
      systeme: promptVerification(),
      message: JSON.stringify({ ...base, texte, reponses_sources: options.sources }),
      schema: SchemaVerdict,
    });
    if (!v.ok) return { statut: "secours", raison: `seconde passe : ${v.raison}` };
    if (v.data.verdict === "ok") return { statut: "ok", texte };
    raison = `seconde passe : KO, règle ${v.data.regle ?? "?"}`;
    console.warn(`[moteur:${emplacement}] essai ${essai}, ${raison}`);
    refus = { texte, raison: `seconde passe, règle ${v.data.regle ?? "?"} : ${v.data.raison ?? ""}` };
  }
  return { statut: "secours", raison: `${raison} (après 2 essais)` };
}
