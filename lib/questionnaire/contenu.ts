/**
 * Le texte du questionnaire V0 (specs/questionnaire-v0.md).
 * Les questions sont fixes : le moteur d'écriture ne les modifie pas.
 * Les codes (AR1, VO2…) ne s'affichent jamais.
 */
import { CAPACITES, PHRASES_ZOOM } from "./capacites";

export const QUETES = ["argent", "voix", "travail", "emotions", "corps", "liens", "creation"] as const;
export type QueteId = (typeof QUETES)[number];

export type CodeCapacite = keyof typeof PHRASES_ZOOM;

export type Quete = {
  id: QueteId;
  nom: string; // « L'Argent »
  prefixe: string; // « AR »
  question: string; // « Mon rapport à l'argent »
  gauche: string; // curseur à 1
  droite: string; // curseur à 5
};

export const QUETE: Record<QueteId, Quete> = {
  argent: {
    id: "argent",
    nom: "L'Argent",
    prefixe: "AR",
    question: "Mon rapport à l'argent",
    gauche: "Je subis, j'évite d'y penser",
    droite: "Je choisis, je sais où je vais",
  },
  voix: {
    id: "voix",
    nom: "La Voix",
    prefixe: "VO",
    question: "Ma façon de dire ce que je pense et ce que je veux",
    gauche: "Je me tais, ou je m'adapte",
    droite: "Je le dis, même quand c'est inconfortable",
  },
  travail: {
    id: "travail",
    nom: "Le Travail",
    prefixe: "TR",
    question: "Ma vie professionnelle",
    gauche: "Je suis sur des rails que je n'ai pas choisis",
    droite: "Mon travail me ressemble",
  },
  emotions: {
    id: "emotions",
    nom: "Les Émotions",
    prefixe: "EM",
    question: "Ce que je ressens",
    gauche: "Je contiens, ou ça déborde",
    droite: "Je comprends ce que je ressens et je sais le dire",
  },
  corps: {
    id: "corps",
    nom: "Le Corps",
    prefixe: "CO",
    question: "Mon corps",
    gauche: "Je le fais taire, ou je le juge",
    droite: "Je l'écoute et j'en prends soin",
  },
  liens: {
    id: "liens",
    nom: "Les Liens",
    prefixe: "LI",
    question: "Mes relations",
    gauche: "Je m'y oublie, ou je me sens seule",
    droite: "Elles me nourrissent, je les ai choisies",
  },
  creation: {
    id: "creation",
    nom: "La Création",
    prefixe: "CR",
    question: "Ce que je crée",
    gauche: "Je ne crée plus, ou je n'ose pas",
    droite: "Je crée régulièrement, pour moi",
  },
};

export function isQueteId(v: unknown): v is QueteId {
  return typeof v === "string" && (QUETES as readonly string[]).includes(v);
}

export function isCode(v: unknown): v is CodeCapacite {
  return typeof v === "string" && v in PHRASES_ZOOM;
}

/** Les codes d'une quête, dans l'ordre des specs. */
export function codesDe(quete: QueteId): CodeCapacite[] {
  const prefixe = QUETE[quete].prefixe;
  return (Object.keys(PHRASES_ZOOM) as CodeCapacite[]).filter((c) => c.startsWith(prefixe));
}

export function queteDuCode(code: CodeCapacite): QueteId {
  return QUETES.find((q) => code.startsWith(QUETE[q].prefixe))!;
}

export function phraseZoom(code: CodeCapacite): string {
  return PHRASES_ZOOM[code];
}

export function libelleCapacite(code: CodeCapacite): string {
  return CAPACITES[code];
}

// ---------------------------------------------------------------------------
// Partie 1 : tes mots
// ---------------------------------------------------------------------------

export const QUESTIONS_OUVERTES = [
  {
    id: "q1_1",
    question: "Qu'est-ce qui t'amène ici, maintenant ?",
    souffle: "Un bilan, une fatigue, une rupture, une envie de changer, une simple curiosité…",
  },
  {
    id: "q1_2",
    question: "Raconte-nous ta vie en ce moment.",
    souffle: "Ton travail, avec qui tu vis, ce qui prend ton temps et ta tête…",
  },
  {
    id: "q1_3",
    question: "Dans trois mois, qu'est-ce que tu aimerais avoir changé ?",
    souffle: "Une décision, une habitude, une relation, un regard sur toi…",
  },
  {
    id: "q1_4",
    question: "Qu'est-ce qui t'en empêche aujourd'hui ?",
    souffle: "Le temps, la peur, les autres, l'argent, toi-même…",
  },
] as const;
export type QuestionOuverteId = (typeof QUESTIONS_OUVERTES)[number]["id"];

// ---------------------------------------------------------------------------
// Partie 2 : les sept quêtes
// ---------------------------------------------------------------------------

export const CURSEUR_ENVIE = {
  question: "Mon envie d'y aller maintenant",
  gauche: "Pas maintenant",
  droite: "C'est le moment",
};

export const QUESTION_APPELLE = "Laquelle t'appelle le plus, et pourquoi ?";

// ---------------------------------------------------------------------------
// Partie 3 : le zoom
// ---------------------------------------------------------------------------

export const ZOOM = {
  choix: "Qu'est-ce qui te ressemble le plus aujourd'hui ? Choisis-en deux au plus.",
  intensite: "À quel point c'est vrai en ce moment ?",
  intensiteGauche: "Un peu",
  intensiteDroite: "Complètement",
  autrement: "Tu le dirais autrement ?",
};

// ---------------------------------------------------------------------------
// Partie 4 : le fil rouge
// ---------------------------------------------------------------------------

export const FIL_ROUGE = [
  { code: "FR1", phrase: "Je sais ce qui compte pour moi." },
  { code: "FR2", phrase: "Je me fais confiance." },
  { code: "FR3", phrase: "Le regard des autres pèse peu sur mes choix." },
  { code: "FR4", phrase: "Je m'autorise ce dont j'ai envie." },
  { code: "FR5", phrase: "Mes choix de vie sont les miens." },
] as const;
export type CodeFilRouge = (typeof FIL_ROUGE)[number]["code"];
export const FIL_ROUGE_GAUCHE = "Pas du tout";
export const FIL_ROUGE_DROITE = "Tout à fait";
export const QUESTION_PAS_ENCORE = "Qu'est-ce que tu ne t'autorises pas encore ?";

// ---------------------------------------------------------------------------
// Partie 5 : pour régler ton chemin
// ---------------------------------------------------------------------------

export const TEMPS = [
  { id: "30min", label: "30 minutes" },
  { id: "1h", label: "1 heure" },
  { id: "2h_plus", label: "2 heures ou plus" },
] as const;
export type TempsId = (typeof TEMPS)[number]["id"];

export const FORMATS = [
  { id: "ecouter", label: "En écoutant" },
  { id: "lire", label: "En lisant" },
  { id: "regarder", label: "En regardant" },
  { id: "faire", label: "En faisant" },
] as const;
export type FormatId = (typeof FORMATS)[number]["id"];

export const PARTIE5 = {
  temps: "Combien de temps peux-tu te donner chaque semaine ?",
  tempsCourt:
    "C'est noté. Certaines semaines demandent environ une heure : on choisira pour toi les formats les plus courts.",
  formats: "Comment apprends-tu le mieux ?",
  formatsAide: "Deux choix au plus.",
  sujets: "Y a-t-il des sujets que tu préfères laisser de côté pour l'instant ?",
  sujetsSouffle: "Un deuil, la maladie, la maternité, le corps…",
  inspiration: "Une autrice, un podcast, une femme qui t'inspire ?",
  toi: "Pour finir, toi.",
  toiAide: "Ton prénom, ton âge, ton code postal. Le code postal servira à te proposer un cercle près de chez toi.",
};

// ---------------------------------------------------------------------------
// Les mondes (fixes pour la V0)
// ---------------------------------------------------------------------------

export const MONDES = ["histoire", "philosophie_pratique", "attention_reseaux"] as const;
export type MondeId = (typeof MONDES)[number];

export const MONDE: Record<MondeId, { nom: string; nomComplet: string; episodes: [string, string] }> = {
  histoire: {
    nom: "Histoire",
    nomComplet: "Histoire, au prisme du féminisme",
    episodes: ["Elle avait un compte, pas la main", "Celles qu'on a effacées"],
  },
  philosophie_pratique: {
    nom: "Philosophie pratique",
    nomComplet: "Philosophie pratique",
    episodes: ["Qu'est-ce qu'une vie choisie ?", "Vivre avec les autres sans se perdre"],
  },
  attention_reseaux: {
    nom: "Attention et réseaux",
    nomComplet: "Attention et réseaux",
    episodes: ["Qui décide de ce que je regarde ?", "Se comparer sans fin"],
  },
};
