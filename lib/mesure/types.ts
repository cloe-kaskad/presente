/** Les étapes qu'on compte (brief V0.10). Jamais de contenu : seulement le fait qu'une action a eu lieu, et quand. */
export const TYPES_EVENEMENT = [
  // parcours
  "questionnaire_commence",
  "questionnaire_termine",
  "carte_vue",
  "chemin_commence",
  // semaine
  "semaine_ouverte",
  "contenu_ouvert",
  "contenu_ecoute",
  "carnet_ecrit",
  "avis_donne",
  "exercice_cree",
  "exercice_jour_note",
  "exercice_termine",
  "fil_lu",
  "semaine_terminee",
  "palier_fait",
  // rituel
  "humeur_notee",
  "question_cherie_repondue",
  "echo_repondu",
  "article_ouvert",
  // visite
  "visite",
  // test
  "surprise_vue",
  "buddy_acceptee",
  "buddy_refusee",
  "buddy_reponse",
  "buddy_explication_vue",
  "buddy_recherche_lancee",
  "buddy_rencontree",
  "cercle_interet",
  // audios guidés
  "audio_lance",
  "audio_termine",
] as const;

export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

/** Ceux qu'un clic dans le navigateur peut noter directement (les autres sont notés par le serveur). */
export const TYPES_DEPUIS_LE_NAVIGATEUR = ["contenu_ouvert", "article_ouvert", "surprise_vue", "audio_lance", "audio_termine"] as const;

/** Une clé est un identifiant court, jamais un texte. */
export const cleValide = (cle: string) => /^[A-Za-z0-9_:.-]{1,60}$/.test(cle);
