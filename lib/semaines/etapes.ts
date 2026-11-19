/**
 * Les étapes d'une semaine, et les huit étapes d'un mois (deux par semaine) pour le tracé.
 * progression[n] = nombre d'étapes faites dans la semaine n. Une semaine est finie quand
 * le chemin est passé à la suivante (« J'ai terminé »).
 */
export const ETAPES_SEMAINE = {
  1: ["avant", "contenu", "carnet", "exercice"],
  2: ["avant", "episode", "apres"],
  3: ["avant", "contenu", "carnet", "acte"],
  4: ["avant", "episode", "apres", "palier"],
} as const;

export type DansLeMois = 1 | 2 | 3 | 4;

/** Les deux points d'une semaine sur le tracé : le contenu (ou l'épisode) vécu, puis la semaine terminée. */
export function pointsDeLaSemaine(d: DansLeMois, faites: number, terminee: boolean): number {
  if (terminee) return 2;
  return faites >= ETAPES_SEMAINE[d].length - 1 ? 1 : 0;
}

/** Combien des huit étapes du mois sont faites. */
export function etapesFaitesDuMois(mois: 0 | 1 | 2, semaineEnCours: number, progression: Record<string, number>): number {
  let total = 0;
  for (let d = 1 as DansLeMois; d <= 4; d = (d + 1) as DansLeMois) {
    const n = mois * 4 + d;
    total += pointsDeLaSemaine(d, progression[String(n)] ?? 0, n < semaineEnCours);
    if (d === 4) break;
  }
  return total;
}

const NOMBRES = ["Aucune", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];
export function enLettres(n: number): string {
  return NOMBRES[n] ?? String(n);
}
