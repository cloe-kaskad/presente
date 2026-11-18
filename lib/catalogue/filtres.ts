/**
 * Les filtres qui protègent : les sujets qu'elle a demandé d'éviter,
 * et les situations qu'elle n'a pas décrites.
 * Lecture simple et prudente, sans appel extérieur.
 */

export function normaliser(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ");
}

function mots(t: string): string[] {
  return normaliser(t)
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** Mots trop communs pour désigner un sujet. */
const VIDES = new Set(
  mots(
    "pour dans avec tout toute tous toutes plus sans elle elles mais rien sujet sujets préfère préfèrerais éviter evite " +
      "parler pas cela ceci comme quand être avoir fait faire très trop encore aussi moment instant maintenant touche " +
      "touchent concerne autour choses chose vraiment plutôt parce envie laisser côté merci aucun aucune pense juste " +
      "surtout notamment certains certaines quelque quelques genre type tout lié liés liée liées",
  ),
);

/** Familles de mots : si elle nomme l'un, tout ce qui touche aux autres est écarté. */
const FAMILLES: string[][] = [
  ["maternite", "mere", "meres", "enfant", "enfants", "grossesse", "bebe", "bebes", "maman", "parentalite", "parental", "parentale", "accouchement"],
  ["deuil", "mort", "deces", "perte", "disparition", "endeuillee"],
  ["maladie", "malade", "cancer", "sante", "hopital", "chronique"],
  ["infertilite", "fertilite", "pma", "fausse", "couche"],
  ["violence", "violences", "agression", "viol", "abus", "emprise"],
  ["alimentation", "poids", "regime", "manger", "nourriture", "anorexie", "boulimie"],
  ["corps", "image", "physique"],
  ["sexualite", "sexe", "desir", "intimite"],
  ["couple", "mari", "compagnon", "compagne", "conjoint", "conjointe", "rupture", "divorce", "separation"],
  ["abandon", "adoption"],
  ["argent", "dette", "dettes"],
];

const racine = (m: string) => m.slice(0, 6);

/** Les racines des sujets qu'elle veut éviter, familles comprises. */
export function racinesAEviter(sujets: string | null | undefined): Set<string> {
  const r = new Set<string>();
  if (!sujets?.trim()) return r;
  for (const m of mots(sujets)) {
    if (m.length < 4 || VIDES.has(m)) continue;
    r.add(racine(m));
    for (const f of FAMILLES) {
      if (f.some((x) => racine(x) === racine(m))) f.forEach((x) => r.add(racine(x)));
    }
  }
  return r;
}

/** Vrai si l'un des textes touche un sujet à éviter. */
export function toucheSujet(racines: Set<string>, ...textes: (string | null | undefined)[]): boolean {
  if (!racines.size) return false;
  return textes.some((t) => t && mots(t).some((m) => m.length >= 3 && racines.has(racine(m))));
}

// ---------------------------------------------------------------------------
// Les situations : on ne propose un contenu qui suppose une situation
// que si elle l'a elle-même décrite.
// ---------------------------------------------------------------------------

export type Situation = "couple" | "mere" | "salariee" | "independante";

const INDICES: Record<Situation, RegExp> = {
  couple:
    /\b(en couple|mon mari|ma femme|mon compagnon|ma compagne|mon conjoint|ma conjointe|mon copain|ma copine|mon mec|mon partenaire|ma partenaire|mon amoureux|mon amoureuse|on s est marie|mariee|pacsee)\b/,
  mere: /\b(mes enfants|mon enfant|ma fille|mon fils|mes filles|mes fils|mon bebe|mes bebes|maman de|mere de|en tant que mere|ma maternite|mes petits)\b/,
  salariee:
    /\b(salariee|mon chef|ma cheffe|ma boss|mon boss|mon manager|ma manager|ma managere|mon employeur|en cdi|en cdd|mes collegues|mon equipe|au bureau|mon entreprise actuelle|dans une agence|dans une entreprise|dans une boite)\b/,
  independante:
    /\b(independante|freelance|free lance|a mon compte|auto entrepreneuse|autoentrepreneuse|micro entreprise|mes clients|mes clientes|ma boite|j ai cree mon entreprise|ma societe|entrepreneuse)\b/,
};

/** Les situations qu'elle a décrites dans ses réponses ouvertes. */
export function situationsDecrites(textes: string): Set<Situation> {
  const t = " " + normaliser(textes).replace(/[^a-z]+/g, " ") + " ";
  const s = new Set<Situation>();
  for (const [k, re] of Object.entries(INDICES) as [Situation, RegExp][]) if (re.test(t)) s.add(k);
  return s;
}

/** Les situations que suppose un contenu (champ « P! Suppose que »). */
export function situationsSupposees(champ: string | null | undefined): Situation[] {
  if (!champ?.trim()) return [];
  const t = normaliser(champ);
  const s: Situation[] = [];
  if (/couple/.test(t)) s.push("couple");
  if (/\bmere|\bmaman|enfant|parent/.test(t)) s.push("mere");
  if (/salari/.test(t)) s.push("salariee");
  if (/independ|freelance|entrepreneu/.test(t)) s.push("independante");
  return s;
}

/** Vrai si le contenu suppose une situation qu'elle n'a pas décrite. Dans le doute, on écarte. */
export function supposeAutreChose(champ: string | null | undefined, decrites: Set<Situation>): boolean {
  const supposees = situationsSupposees(champ);
  if (champ?.trim() && !supposees.length) return true; // valeur inconnue : prudence
  return supposees.some((s) => !decrites.has(s));
}
