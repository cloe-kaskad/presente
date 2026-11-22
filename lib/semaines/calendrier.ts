/**
 * Le calendrier du chemin (brief V0.9). Règle de Cloé : une semaine arrive 7 jours après le début de la
 * précédente. Le début d'une semaine est le jour où elle l'a ouverte pour la première fois (le début du
 * chemin pour la semaine 1), rangé dans la progression sous « debut{n} » (secondes).
 * Le jour venu, la semaine suivante s'ouvre, que la précédente soit finie ou non.
 */
import { jourAParis, plusJours } from "@/lib/rituel/citations";
import { ETAPES_SEMAINE, type DansLeMois } from "./etapes";

export const cleDebut = (n: number) => `debut${n}`;
const dansLeMois = (n: number) => (((n - 1) % 4) + 1) as DansLeMois;

/** Le jour (AAAA-MM-JJ, Paris) où la semaine n a commencé, ou null si elle n'a pas encore été ouverte. */
export function debutDe(n: number, progression: Record<string, number>, dateDebutChemin?: string | null): string | null {
  const s = progression[cleDebut(n)];
  if (s && s > 0) return jourAParis(new Date(s * 1000));
  if (n === 1 && dateDebutChemin) return String(dateDebutChemin).slice(0, 10);
  return null;
}

/** Le jour où la semaine n + 1 arrive : 7 jours après le début de la semaine n. */
export function arriveeApres(n: number, progression: Record<string, number>, dateDebutChemin?: string | null): string | null {
  const d = debutDe(n, progression, dateDebutChemin);
  return d ? plusJours(d, 7) : null;
}

/** La dernière semaine ouverte aujourd'hui, en partant de celle déjà enregistrée. */
export function semaineOuverte(args: { semaine: number; progression: Record<string, number>; dateDebut?: string | null; aujourdhui?: string }): number {
  const aujourdhui = args.aujourdhui ?? jourAParis();
  let n = Math.max(1, args.semaine);
  while (n < 12) {
    const arrivee = arriveeApres(n, args.progression, args.dateDebut);
    if (!arrivee || arrivee > aujourdhui) break;
    n++;
  }
  return n;
}

/** Une semaine est faite quand toutes ses étapes le sont (« J'ai terminé », exercice terminé, palier). */
export function semaineFaite(n: number, progression: Record<string, number>): boolean {
  return (progression[String(n)] ?? 0) >= ETAPES_SEMAINE[dansLeMois(n)].length;
}
