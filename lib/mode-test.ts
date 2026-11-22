/**
 * Phase de test (brief V0.10). Un seul interrupteur : à passer à false au lancement.
 * En test : la page de l'équipe affiche tous les chiffres avec la mention « phase de test » ;
 * le bandeau de la surprise et les mentions « exemple » sont visibles.
 */
export const MODE_TEST = true;

/** Après le lancement, un chiffre qui porte sur moins de 5 personnes n'est pas affiché. */
export const SEUIL_CONFIDENTIALITE = 5;
