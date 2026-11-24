/** Les humeurs, au féminin, du plus lourd au plus vivant, et leur couleur dans le journal. */
import { HUMEURS, type Humeur } from "@/lib/chemin/textes";

export { HUMEURS, type Humeur };

export const COULEUR: Record<Humeur, { fond: string; texte: string; famille: string }> = {
  triste: { fond: "#510004", texte: "#ffffff", famille: "lourde, triste" },
  lourde: { fond: "#510004", texte: "#ffffff", famille: "lourde, triste" },
  anxieuse: { fond: "#8a6f70", texte: "#ffffff", famille: "anxieuse, énervée" },
  "énervée": { fond: "#8a6f70", texte: "#ffffff", famille: "anxieuse, énervée" },
  "fatiguée": { fond: "#cfc4c5", texte: "#510004", famille: "grise, fatiguée" },
  grise: { fond: "#cfc4c5", texte: "#510004", famille: "grise, fatiguée" },
  calme: { fond: "#d4eaff", texte: "#0f2a44", famille: "calme" },
  "légère": { fond: "#f7beca", texte: "#510004", famille: "légère" },
  enthousiaste: { fond: "#e6361d", texte: "#ffffff", famille: "vivante" },
  vivante: { fond: "#e6361d", texte: "#ffffff", famille: "vivante" },
};

export const LEGENDE = [
  { label: "lourde, triste", couleur: "#510004" },
  { label: "anxieuse, énervée", couleur: "#8a6f70" },
  { label: "grise, fatiguée", couleur: "#cfc4c5" },
  { label: "calme", couleur: "#d4eaff" },
  { label: "légère", couleur: "#f7beca" },
  { label: "vivante", couleur: "#e6361d" },
];

/** Les humeurs lourdes : trois jours de suite, le chemin s'allège. « fatiguée » n'en fait pas partie. */
export const HUMEURS_LOURDES: Humeur[] = ["triste", "lourde", "anxieuse"];

export function estHumeur(h: unknown): h is Humeur {
  return typeof h === "string" && (HUMEURS as readonly string[]).includes(h);
}

/** Vrai si les trois derniers jours notés, consécutifs et jusqu'à aujourd'hui ou hier, sont lourds. */
export function troisJoursLourds(jours: { jour: string; humeur: string }[], aujourdhui: string): boolean {
  const parJour = new Map(jours.map((j) => [j.jour, j.humeur]));
  const veille = (j: string, n: number) => new Date(Date.parse(`${j}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
  for (const depart of [aujourdhui, veille(aujourdhui, 1)]) {
    const trois = [0, 1, 2].map((n) => parJour.get(veille(depart, n)));
    if (trois.every((h) => h && (HUMEURS_LOURDES as string[]).includes(h))) return true;
  }
  return false;
}
