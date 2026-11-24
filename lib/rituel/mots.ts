/**
 * « + un mot » (brief V0.12) : ses mots d'humeur à elle, gardés dans sa liste pour les jours suivants.
 * Règles : 1 à 24 caractères, espaces en trop retirés, en minuscules ; pas de doublon (ni avec les dix mots,
 * ni avec les siens) ; huit mots à elle au plus.
 */
import { HUMEURS } from "./humeurs";

export const MOTS_MAX = 8;
export const MOT_LONGUEUR_MAX = 24;
export const TROP_DE_MOTS = "Tu as déjà huit mots à toi. Retires-en un pour en ajouter un autre.";

/** Le mot tel qu'on le garde : espaces en trop retirés, en minuscules. Vide s'il n'y a rien. */
export function normaliserMot(mot: string): string {
  return mot.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr-FR").normalize("NFC");
}

export const estMotDeBase = (mot: string) => (HUMEURS as readonly string[]).includes(mot);

/** Ses mots, nettoyés : seulement des chaînes valides, sans doublon, huit au plus. */
export function nettoyerMots(mots: unknown): string[] {
  if (!Array.isArray(mots)) return [];
  const vus: string[] = [];
  for (const m of mots) {
    if (typeof m !== "string") continue;
    const n = normaliserMot(m);
    if (n && n.length <= MOT_LONGUEUR_MAX && !estMotDeBase(n) && !vus.includes(n)) vus.push(n);
  }
  return vus.slice(0, MOTS_MAX);
}

export type Ajout =
  | { ok: true; mot: string; mots: string[]; nouveau: boolean }
  | { ok: false; erreur: string; mots: string[] };

/**
 * Ajouter un mot à sa liste. S'il existe déjà (dans les dix mots ou dans les siens), on le choisit simplement,
 * sans doublon. Au neuvième, on refuse avec une phrase claire.
 */
export function ajouterMot(mots: string[], brut: string): Ajout {
  const mot = normaliserMot(brut);
  if (!mot) return { ok: false, erreur: "Écris un mot.", mots };
  if (mot.length > MOT_LONGUEUR_MAX) return { ok: false, erreur: `${MOT_LONGUEUR_MAX} caractères au plus.`, mots };
  if (estMotDeBase(mot) || mots.includes(mot)) return { ok: true, mot, mots, nouveau: false };
  if (mots.length >= MOTS_MAX) return { ok: false, erreur: TROP_DE_MOTS, mots };
  return { ok: true, mot, mots: [...mots, mot], nouveau: true };
}

/** Retirer un mot de sa liste. Les jours déjà notés avec ce mot ne changent pas. */
export function retirerMot(mots: string[], mot: string): string[] {
  const n = normaliserMot(mot);
  return mots.filter((m) => m !== n);
}
