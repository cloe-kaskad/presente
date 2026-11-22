/**
 * L'état de la buddy, rangé dans la progression du chemin (aucune colonne ajoutée) :
 * buddy : 1 rencontrée, 2 arrêtée, 3 recherche lancée ; buddy_le : le jour de la rencontre (secondes) ;
 * buddy_recherche_le : quand elle a lancé la recherche ; buddy_trouvee : trouvée tout de suite (panneau de test) ;
 * buddy_refus : nombre de « Pas maintenant » ;
 * buddy_refus_semaine : la semaine du dernier refus ; buddy_montre : 1 = prénom, 2 = quête (on additionne) ;
 * buddy_test : l'équipe l'a proposée depuis le panneau de test ;
 * buddy_avance : semaines d'avance prises en test (« Ouvrir la suite maintenant » fait aussi avancer la question).
 * Sa phrase de présentation et ses réponses sont dans son carnet (codes « buddy:presentation », « buddy:q1 »…).
 */
export type EtatBuddy = "rien" | "proposee" | "recherche" | "trouvee" | "acceptee" | "arretee";

const jourParis = (secondes: number) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(secondes * 1000));

export function etatBuddy(p: Record<string, number>, semaine: number, maintenant = Date.now() / 1000): EtatBuddy {
  if (p.buddy === 2) return "arretee";
  if (p.buddy === 1) return "acceptee";
  if (p.buddy === 3) {
    // En test, on la « trouve » le lendemain (à la première visite après minuit), ou tout de suite depuis le panneau de test.
    // « Simuler : pas encore trouvée après 24 h » (buddy_lente) : plus de « trouvée » automatique.
    const lendemain = p.buddy_recherche_le && !p.buddy_lente ? jourParis(maintenant) > jourParis(p.buddy_recherche_le) : false;
    return (p.buddy_trouvee ?? 0) > 0 || lendemain ? "trouvee" : "recherche";
  }
  const refus = p.buddy_refus ?? 0;
  if ((p.buddy_test ?? 0) > 0 && refus === 0) return "proposee";
  // Au quatorzième jour (ouverture de la semaine 3) ; après un « Pas maintenant », une seule fois encore au début du mois 2.
  if (refus === 0) return semaine >= 3 ? "proposee" : "rien";
  if (refus === 1 && semaine >= 5 && (p.buddy_refus_semaine ?? 0) < 5) return "proposee";
  return "rien";
}

/** Le numéro de la question de la semaine (1, 2, 3…), compté à partir du jour où elle a accepté. */
export function numeroDeQuestion(accepteLe: number | undefined, maintenant = Date.now() / 1000, total = 4): number {
  if (!accepteLe) return 1;
  return Math.max(1, Math.min(total, Math.floor((maintenant - accepteLe) / (7 * 86400)) + 1));
}

const SEMAINE = 7 * 86400;

/** Le début de l'échange tel qu'on le compte : l'accord, moins les semaines d'avance prises en test. */
export const debutEchange = (p: Record<string, number>) => (p.buddy_le ?? 0) - (p.buddy_avance ?? 0) * SEMAINE;

/** Le jour (secondes) où arrive la question suivante : 7 jours après le début de la question en cours. */
export function prochaineQuestionLe(p: Record<string, number>, numero: number): number {
  return debutEchange(p) + numero * SEMAINE;
}

/** L'élision : « Ce qu'Inès », « Ce que Marie » ; « d'Inès », « de Marie ». */
const voyelle = (prenom: string) => /^[aeiouyhàâäéèêëîïôöùûü]/i.test(prenom.normalize("NFC"));
export const ceQue = (prenom: string) => (voyelle(prenom) ? `Ce qu'${prenom}` : `Ce que ${prenom}`);
export const de = (prenom: string) => (voyelle(prenom) ? `d'${prenom}` : `de ${prenom}`);

/**
 * Le code de sa réponse à la question n, dans son carnet. Chaque nouvel échange (« Recommencer », nouvelle buddy)
 * a son numéro, pour repartir d'une page blanche ; le premier garde les codes d'origine (« buddy:q1 »).
 */
export const codeReponse = (p: Record<string, number>, n: number) => ((p.buddy_echange ?? 0) > 0 ? `buddy:e${p.buddy_echange}q${n}` : `buddy:q${n}`);

/**
 * La question où elle en est, sur les douze : une par semaine depuis la rencontre, mais on ne passe au mois suivant
 * que si elle a dit « Oui, on continue » au point de fin de mois (buddy_suite_m1, buddy_suite_m2).
 */
export function numeroAccessible(p: Record<string, number>, maintenant = Date.now() / 1000): number {
  let n = numeroDeQuestion(debutEchange(p), maintenant, 12);
  if (n > 4 && p.buddy_suite_m1 !== 1) n = 4;
  if (n > 8 && p.buddy_suite_m2 !== 1) n = 8;
  return n;
}

/** Le point de fin de mois à proposer (1 ou 2), une fois la quatrième question du mois répondue. Sinon null. */
export function pointDuMois(p: Record<string, number>, numero: number, aRepondu: boolean): 1 | 2 | null {
  if (!aRepondu) return null;
  if (numero === 4 && p.buddy_suite_m1 === undefined) return 1;
  if (numero === 8 && p.buddy_suite_m2 === undefined) return 2;
  return null;
}

/** La fin du chemin à deux : la douzième question répondue, ou le panneau de test. */
export const finDuCheminADeux = (p: Record<string, number>, douzeRepondue: boolean) => douzeRepondue || (p.buddy_fin_test ?? 0) > 0;

/** Le code de son « mot pour elle » à la question n, dans son carnet (une ligne, une fois par semaine). */
export const codeMot = (p: Record<string, number>, n: number) => `${codeReponse(p, n)}m`;

/** La recherche dure depuis plus de 24 heures (ou le panneau de test le simule) : « On cherche encore… ». */
export const rechercheLongue = (p: Record<string, number>, maintenant = Date.now() / 1000) =>
  (p.buddy_lente ?? 0) > 0 || (p.buddy_recherche_le ? maintenant - p.buddy_recherche_le > 86400 : false);

/** « demandé aujourd'hui », « demandé hier », « demandé mardi », puis « demandé le 3 novembre ». */
export function demandeLe(secondes: number | undefined, maintenant = Date.now() / 1000): string {
  if (!secondes) return "demandé aujourd'hui";
  const j = (s: number) => Date.parse(`${jourParis(s)}T12:00:00Z`) / 864e5;
  const ecart = Math.round(j(maintenant) - j(secondes));
  if (ecart <= 0) return "demandé aujourd'hui";
  if (ecart === 1) return "demandé hier";
  const d = new Date(secondes * 1000);
  if (ecart < 7) return `demandé ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long" }).format(d)}`;
  return `demandé le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(d)}`;
}

/** « Pas maintenant » choisi, et la proposition n'est pas revenue : une ligne tout en bas de Mon chemin. */
export const plusTard = (p: Record<string, number>, etat: EtatBuddy) => etat === "rien" && (p.buddy_refus ?? 0) > 0;
