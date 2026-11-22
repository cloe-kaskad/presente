/** La surprise arrive au dixième jour du chemin (brief V0.10), ou plus tôt si l'équipe la déclenche en test. */
import { jourAParis, plusJours } from "@/lib/rituel/citations";

export function surpriseArrivee(progression: Record<string, number>, dateDebut: string | null | undefined, aujourdhui = jourAParis()): boolean {
  if ((progression.surprise ?? 0) > 0) return true;
  if (!dateDebut) return false;
  return plusJours(String(dateDebut).slice(0, 10), 9) <= aujourdhui;
}

export const surpriseOuverte = (progression: Record<string, number>) => (progression.surprise_vue ?? 0) > 0;
