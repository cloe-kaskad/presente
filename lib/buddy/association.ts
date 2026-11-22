/**
 * Les règles d'association (brief V0.10), écrites pour la vraie version : non utilisées en test.
 * - sur accord des deux uniquement ;
 * - pas avant le quatorzième jour (ouverture de la semaine 3) ;
 * - par étape plutôt que par date : même mois du chemin, même quête si possible, une semaine d'écart au plus.
 * Sinon elle attend : « On te présente quelqu'un dès qu'une femme en est au même point que toi. »
 */
export type CandidateBuddy = { id: string; accord: boolean; semaine: number; quete: string; dejaAssociee: boolean };

export const MESSAGE_ATTENTE = "On te présente quelqu'un dès qu'une femme en est au même point que toi.";

const mois = (semaine: number) => Math.floor((semaine - 1) / 4);

export function peuventEtreAssociees(a: CandidateBuddy, b: CandidateBuddy): boolean {
  if (a.id === b.id || !a.accord || !b.accord || a.dejaAssociee || b.dejaAssociee) return false;
  if (a.semaine < 3 || b.semaine < 3) return false;
  if (mois(a.semaine) !== mois(b.semaine)) return false;
  return Math.abs(a.semaine - b.semaine) <= 1;
}

/** La meilleure personne pour `elle` : même quête d'abord, puis la plus proche en semaine. null : elle attend. */
export function choisirBuddy(elle: CandidateBuddy, autres: CandidateBuddy[]): CandidateBuddy | null {
  const possibles = autres.filter((b) => peuventEtreAssociees(elle, b));
  possibles.sort((x, y) => Number(y.quete === elle.quete) - Number(x.quete === elle.quete) || Math.abs(x.semaine - elle.semaine) - Math.abs(y.semaine - elle.semaine));
  return possibles[0] ?? null;
}
