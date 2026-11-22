/** « J'ai écouté » : quand elle a dit avoir écouté (ou lu, ou regardé) le contenu de la semaine n. */

export const cleEcoute = (n: number) => `ecoute${n}`;

/**
 * La date d'écoute en secondes, ou null.
 * Avant ce changement, rien n'était enregistré : un carnet rempli pour ce contenu vaut écoute (à sa date).
 */
export function ecouteLe(
  n: number,
  progression: Record<string, number>,
  entrees: { code: string; reponse: string; creee?: string }[],
  /** Semaine de monde : toute réponse de la semaine (questions d'après l'épisode) vaut écoute. */
  toutVaut = false,
): number | null {
  const v = progression[cleEcoute(n)];
  if (typeof v === "number") return v > 0 ? v : null;
  const ecrits = entrees
    .filter((e) => (toutVaut ? e.code.startsWith(`s${n}:`) && !e.code.startsWith(`s${n}:avant`) : e.code.startsWith(`s${n}:carnet:`)) && e.reponse.trim() && e.creee)
    .map((e) => Date.parse(String(e.creee)))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  return ecrits.length ? Math.floor(ecrits[0] / 1000) : null;
}

export const MOTS_ECOUTE: Record<string, { fait: string; le: string; encore: string }> = {
  ecouter: { fait: "J'ai écouté", le: "Écouté le", encore: "Réécouter" },
  regarder: { fait: "J'ai regardé", le: "Regardé le", encore: "Revoir" },
  lire: { fait: "J'ai lu", le: "Lu le", encore: "Relire" },
};
export const motsEcoute = (format: string | null | undefined) => MOTS_ECOUTE[format ?? ""] ?? MOTS_ECOUTE.ecouter;
