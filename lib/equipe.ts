import { isEmailAllowed } from "./allowed-emails";

/** L'équipe (page de mesure, panneau de test) : les adresses de la variable EQUIPE_EMAILS. */
export function estEquipe(email: string | null | undefined): boolean {
  return isEmailAllowed(email, process.env.EQUIPE_EMAILS);
}

/** Les testeuses (« Un retour ? ») : les adresses de TESTEUSES_EMAILS, plus l'équipe. Jamais une cliente. */
export function estTesteuse(email: string | null | undefined): boolean {
  return estEquipe(email) || isEmailAllowed(email, process.env.TESTEUSES_EMAILS);
}
