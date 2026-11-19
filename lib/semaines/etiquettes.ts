/** Les noms des semaines, partout pareils : « Semaine 3 · L'Argent », « Mois 2 · semaine 2 · monde Philosophie pratique ». */
import { MONDE, QUETE, type MondeId, type QueteId } from "@/lib/questionnaire/contenu";

export type CheminPourEtiquette = { quetes: QueteId[]; mondes: MondeId[] };

export function moisDe(n: number): 0 | 1 | 2 {
  return Math.min(2, Math.floor((n - 1) / 4)) as 0 | 1 | 2;
}

export function dansLeMois(n: number): 1 | 2 | 3 | 4 {
  return (((n - 1) % 4) + 1) as 1 | 2 | 3 | 4;
}

export function etiquetteSemaine(chemin: CheminPourEtiquette, n: number): string {
  const m = moisDe(n);
  const d = dansLeMois(n);
  const quoi = d === 1 || d === 3 ? QUETE[chemin.quetes[m]].nom : `monde ${MONDE[chemin.mondes[m]].nom}`;
  return m === 0 ? `Semaine ${d} · ${quoi}` : `Mois ${m + 1} · semaine ${d} · ${quoi}`;
}

export const RETOURS = [
  { id: "parle", label: "ça m'a parlé" },
  { id: "pas_maintenant", label: "pas maintenant" },
  { id: "pas_pour_moi", label: "pas pour moi" },
] as const;
