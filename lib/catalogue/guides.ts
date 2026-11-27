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
 * La pause guidée (Cloé, 27 novembre) : dans les semaines sans capacité ni « Tirer le fil » (semaines 2 et 4, celles
 * du monde), une visualisation ou une respiration guidée prend la place de « Tirer le fil ». Elle ne remplace jamais
 * l'exercice. Semaine 2 : le guidage de sa quête s'il existe, puis on tourne parmi les autres.
 */
export function guideDeLaSemaine<T extends { id: string; nom: string; quete: string | null; audio?: string | null }>(
  pratiques: T[],
  quete: string,
  n: number,
): T | null {
  const d = ((n - 1) % 4) + 1;
  if (d !== 2 && d !== 4) return null;
  const guides = pratiques.filter((p) => p.audio).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  if (!guides.length) return null;
  const ordre = [...guides.filter((g) => g.quete === quete), ...guides.filter((g) => g.quete !== quete)];
  const rang = Math.floor((n - 1) / 4) * 2 + (d === 4 ? 1 : 0);
  return ordre[rang % ordre.length];
}

/** Le nom du fichier audio d'une pratique, ou null. Seulement un nom de fichier simple (pas de chemin). */
export function fichierAudio(champ: string, nom: string): string | null {
  const f = champ.trim();
  if (/^[a-z0-9][a-z0-9._-]*\.(m4a|mp3|ogg|wav|aac)$/i.test(f)) return f;
  return MODE_TEST ? (GUIDES_PREVUS[nom.trim()] ?? null) : null;
}
