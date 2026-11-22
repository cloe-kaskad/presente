/**
 * Les douze questions de la buddy (brief V0.11), la même pour les deux, une par semaine, sur tout le chemin.
 * Elles vont un peu plus loin de mois en mois. On ne demande jamais à l'une de juger l'autre.
 * La dernière de chaque mois est la même : choisir une phrase de l'autre (un cadeau, pas une analyse).
 * Textes provisoires : Cloé les réécrira.
 */
export type QuestionBuddy = { mois: 1 | 2 | 3; texte: string; phrase?: true };

export const QUESTION_PHRASE = "Dans ce qu'elle a écrit ce mois-ci, quelle phrase t'est restée ?";

export const THEMES_MOIS = { 1: "ce que je fais", 2: "ce qui résiste", 3: "ce que j'emporte" } as const;

export const QUESTIONS_BUDDY_MOIS: QuestionBuddy[] = [
  // Mois 1, ce que je fais
  { mois: 1, texte: "Qu'est-ce que tu as osé cette semaine, même petit ?" },
  { mois: 1, texte: "Qu'est-ce que tu as fait pour toi et pour personne d'autre ?" },
  { mois: 1, texte: "Où as-tu dit oui en pensant non ?" },
  { mois: 1, texte: QUESTION_PHRASE, phrase: true },
  // Mois 2, ce qui résiste
  { mois: 2, texte: "Qu'est-ce que tu remets à plus tard depuis longtemps, et que tu sais ?" },
  { mois: 2, texte: "De quoi as-tu peur que les autres pensent ?" },
  { mois: 2, texte: "Qu'est-ce que tu n'as encore dit à personne sur ce que tu traverses ?" },
  { mois: 2, texte: QUESTION_PHRASE, phrase: true },
  // Mois 3, ce que j'emporte
  { mois: 3, texte: "Qu'est-ce qui a bougé chez toi et que personne n'a encore remarqué ?" },
  { mois: 3, texte: "Qu'est-ce que tu ne feras plus comme avant ?" },
  { mois: 3, texte: "Que dirais-tu à celle que tu étais il y a trois mois ?" },
  { mois: 3, texte: QUESTION_PHRASE, phrase: true },
];

/** Gardé pour la compatibilité : les textes seuls, dans l'ordre. */
export const QUESTIONS_BUDDY = QUESTIONS_BUDDY_MOIS.map((q) => q.texte);

/** Les phrases d'une réponse, pour en choisir une en la touchant. */
export function phrasesDe(texte: string): string[] {
  return texte
    .split(/(?<=[.!?…»])\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 3);
}
