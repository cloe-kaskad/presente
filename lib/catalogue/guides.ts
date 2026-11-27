/**
 * Les exercices guidés à la voix de Cloé (brief V0.10, partie 5). Le site sait qu'une pratique a un audio par
 * le champ « Audio (fichier) » de P! Pratiques (fldKb51iu5jOEGtqf), qui contient le nom du fichier rangé dans public/audio/.
 * En phase de test, tant que le champ est vide, les trois guidages prévus sont reconnus par leur nom, « comme s'ils
 * existaient » : le lecteur joue l'enregistrement provisoire, avec la mention, comme pour le podcast.
 */
import { MODE_TEST } from "@/lib/mode-test";

export const GUIDES_PREVUS: Record<string, string> = {
  "Trois souffles avant de répondre": "trois-souffles.m4a",
  "Cinq minutes assise, rien à réussir": "cinq-minutes-assise.m4a",
  "Le corps répond en premier": "le-corps-repond.m4a",
};

/** L'enregistrement joué tant que le vrai fichier n'est pas dans public/audio/. */
export const AUDIO_PROVISOIRE = "/audio/provisoire.mp3";

/**
 * En phase de test, l'exercice de la semaine 1 de chaque mois est un exercice guidé (Cloé, 27 novembre :
 * « au minimum une fois par mois »). Pour la vraie version, à décider.
 */
export const GUIDE_CHAQUE_MOIS = MODE_TEST;

/** Le nom du fichier audio d'une pratique, ou null. Seulement un nom de fichier simple (pas de chemin). */
export function fichierAudio(champ: string, nom: string): string | null {
  const f = champ.trim();
  if (/^[a-z0-9][a-z0-9._-]*\.(m4a|mp3|ogg|wav|aac)$/i.test(f)) return f;
  return MODE_TEST ? (GUIDES_PREVUS[nom.trim()] ?? null) : null;
}
