/**
 * Textes fixes de la carte et du chemin.
 * Le « pourquoi pour toi » sera écrit par le moteur d'écriture (étape 6) ;
 * en attendant, et en secours, une phrase générique qui peut citer ses mots exacts.
 */
import { MONDE, type MondeId } from "@/lib/questionnaire/contenu";

export const ETIQUETTE_MOIS = ["Mois 1 · l'élan", "Mois 2 · le cœur", "Mois 3"] as const;

const POURQUOI_SECOURS = [
  "On commence là, parce que c'est là que tu as le plus envie d'aller.",
  "C'est là que tu te sens le plus loin : on y va au milieu du chemin, avec de l'élan.",
  "On y arrive en dernier, avec tout ce que tu auras écrit en route.",
] as const;

const LONGUEUR_CITATION_MAX = 140;

function normaliser(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Vrai si un mot d'au moins 4 lettres de ses sujets à éviter apparaît dans le texte. */
export function toucheUnSujetAEviter(texte: string, sujets: string | null | undefined): boolean {
  if (!sujets?.trim()) return false;
  const t = normaliser(texte);
  return normaliser(sujets)
    .split(/[^a-z]+/)
    .filter((m) => m.length >= 4)
    .some((m) => t.includes(m));
}

export type PourquoiSecours = { citation: string | null; suite: string };

/** « Tu as écrit « … ». » + la phrase du mois. La citation est ses mots exacts, sinon rien. */
export function pourquoiSecours(
  mois: 0 | 1 | 2,
  sesMots: string | undefined,
  sujetsAEviter?: string | null,
): PourquoiSecours {
  const mots = sesMots?.trim();
  const citable =
    mots && mots.length <= LONGUEUR_CITATION_MAX && !toucheUnSujetAEviter(mots, sujetsAEviter) ? mots : null;
  return { citation: citable, suite: POURQUOI_SECOURS[mois] };
}

export type Semaine = {
  numero: number; // 1 à 12
  dansLeMois: 1 | 2 | 3 | 4;
  etiquette: string;
  titre: string;
  description: string;
};

/** Les 4 semaines d'un mois, selon le rythme du plan produit. */
export function semainesDuMois(
  mois: 0 | 1 | 2,
  capacites: [string, string],
  monde: MondeId,
): Semaine[] {
  const base = mois * 4;
  const m = MONDE[monde];
  return [
    {
      numero: base + 1,
      dansLeMois: 1,
      etiquette: "Semaine 1 · écouter, écrire",
      titre: capacites[0],
      description: "Un contenu choisi pour toi, ton carnet, puis un exercice pour ouvrir la question.",
    },
    {
      numero: base + 2,
      dansLeMois: 2,
      etiquette: `Semaine 2 · monde ${m.nom}`,
      titre: m.episodes[0],
      description: "Un épisode de 25 minutes, puis trois questions pour toi.",
    },
    {
      numero: base + 3,
      dansLeMois: 3,
      etiquette: "Semaine 3 · agir",
      titre: capacites[1],
      description: "Un contenu, ton carnet, puis un geste à poser dans ta semaine.",
    },
    {
      numero: base + 4,
      dansLeMois: 4,
      etiquette: `Semaine 4 · monde ${m.nom}, puis le palier`,
      titre: m.episodes[1],
      description: "Le second épisode, puis le palier : le point sur ton mois.",
    },
  ];
}

/** Au féminin. De la plus lourde à la plus vive. */
export const HUMEURS = [
  "triste",
  "lourde",
  "anxieuse",
  "énervée",
  "fatiguée",
  "grise",
  "calme",
  "légère",
  "enthousiaste",
  "vivante",
] as const;
export type Humeur = (typeof HUMEURS)[number];

/** Le prénom, toujours avec une majuscule : « marie-claire » devient « Marie-Claire ». */
export function prenomAffiche(prenom: string | null | undefined): string | null {
  const p = prenom?.trim();
  if (!p) return null;
  return p
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());
}
