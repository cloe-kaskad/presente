/**
 * L'écho du carnet : chaque jour, une de ses réponses vieille d'au moins dix jours,
 * choisie par la date. Jamais une réponse qui touche un sujet à éviter.
 */
import { racinesAEviter, toucheSujet } from "@/lib/catalogue/filtres";
import { numeroDuJour } from "./citations";

export type Candidat = { code: string; question: string; reponse: string; jour: string };

const LONGUEUR_MAX = 180;

/** Une phrase courte, recopiée telle quelle : la réponse entière si elle est courte, sinon sa première phrase. */
export function extraitExact(reponse: string): string | null {
  const t = reponse.trim();
  if (!t) return null;
  if (t.length <= LONGUEUR_MAX) return t;
  const premiere = t.split(/(?<=[.!?…])\s+/)[0];
  return premiere.length <= LONGUEUR_MAX && premiere.length >= 12 ? premiere : null;
}

export function echoDuJour(candidats: Candidat[], aujourdhui: string, sujetsAEviter: string | null | undefined): Candidat | null {
  const limite = new Date(Date.parse(`${aujourdhui}T12:00:00Z`) - 10 * 86_400_000).toISOString().slice(0, 10);
  const aEviter = racinesAEviter(sujetsAEviter);
  const possibles = candidats
    .filter((c) => c.jour <= limite)
    .map((c) => ({ ...c, reponse: extraitExact(c.reponse) ?? "" }))
    .filter((c) => c.reponse && !toucheSujet(aEviter, c.reponse, c.question))
    .sort((a, b) => (a.jour + a.code < b.jour + b.code ? -1 : 1));
  if (!possibles.length) return null;
  return possibles[numeroDuJour(aujourdhui) % possibles.length];
}

export const REPONSES_ECHO = ["oui", "plus tout à fait", "plus du tout"] as const;
