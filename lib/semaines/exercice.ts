/**
 * L'exercice (semaine 1) ou le geste (semaine 3), sur sa propre page.
 * Son état est rangé dans paths.progression, sous la clé « ex{n} » : 1 = commencé, 2 = terminé.
 * Les exercices d'avant cette page (sans clé) sont déduits : semaine finie = terminé,
 * quelque chose d'écrit = en cours.
 */

export type EtatExercice = "pas_commence" | "en_cours" | "termine";

export const cleEtat = (n: number) => `ex${n}`;

const NOMBRES: Record<string, number> = {
  une: 1, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, quinze: 15,
};

const nombre = (mot: string) => NOMBRES[mot] ?? (Number.isFinite(Number(mot)) ? Number(mot) : NaN);

/**
 * Le nombre de jours d'un exercice à faire sur plusieurs jours, d'après son rythme dans Airtable
 * (« Une semaine », « Deux semaines, quotidien », « Dix jours, une phrase par soir », « Chaque soir, 2 min »).
 * null : un exercice en une fois.
 */
export function joursDuRythme(rythme: string | null | undefined): number | null {
  const r = (rythme ?? "").toLowerCase().normalize("NFC");
  const semaines = r.match(/(\S+)\s+semaines?\b/);
  if (semaines) {
    const k = nombre(semaines[1]);
    if (k >= 1 && k <= 3) return k * 7;
  }
  const jours = r.match(/(\S+)\s+jours?\b/);
  if (jours && !/puis/.test(r)) {
    const k = nombre(jours[1]);
    if (k >= 2 && k <= 21) return k;
  }
  if (/^chaque (soir|matin|jour)/.test(r)) return 7;
  return null;
}

export const codeJour = (n: number, jour: string) => `s${n}:exo:jour:${jour}`;
export const estCodeJour = (n: number, code: string) => code.startsWith(`s${n}:exo:jour:`);
export const jourDuCode = (code: string) => code.split(":").pop() ?? "";
export const codeRetiens = (n: number) => `s${n}:exo:retiens`;

/** Ce qu'elle a écrit pour la pratique de la semaine n (exercice ou geste), sans « ce que tu en retiens ». */
export function aEcrit(n: number, entrees: { code: string; reponse: string }[]): boolean {
  return entrees.some(
    (e) => (e.code.startsWith(`s${n}:exo:`) || e.code.startsWith(`s${n}:acte:`)) && e.code !== codeRetiens(n) && e.reponse.trim(),
  );
}

export function etatExercice(args: {
  n: number;
  progression: Record<string, number>;
  semaineCourante: number;
  entrees: { code: string; reponse: string }[];
}): EtatExercice | null {
  const { n, progression, semaineCourante, entrees } = args;
  if ((progression[String(n)] ?? 0) < 3 && n >= semaineCourante) return null; // pas encore créé
  const cle = progression[cleEtat(n)];
  if (cle === 2) return "termine";
  if (cle === 1) return "en_cours";
  if (n < semaineCourante) return "termine";
  return aEcrit(n, entrees) ? "en_cours" : "pas_commence";
}

/** Le jour où elle en est : les jours déjà notés, plus aujourd'hui s'il ne l'est pas encore. */
export function jourEnCours(total: number, joursNotes: string[], aujourdhui: string): number {
  const distincts = new Set(joursNotes);
  const n = distincts.size + (distincts.has(aujourdhui) ? 0 : 1);
  return Math.max(1, Math.min(total, n));
}
