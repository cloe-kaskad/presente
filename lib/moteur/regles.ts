/**
 * Les règles du moteur d'écriture qu'on peut vérifier sans Claude.
 * Elles passent avant la seconde passe : un texte qui échoue ici est remplacé par le texte de secours.
 */
import { racinesAEviter, toucheSujet } from "@/lib/catalogue/filtres";

export type Emplacement =
  | "carte_synthese"
  | "carte_pourquoi"
  | "capacite"
  | "monde_accroche"
  | "monde_pourquoi";

/** Longueur maximale, en caractères, de chaque texte (ou de chaque bloc pour la synthèse). */
export const LONGUEUR_MAX: Record<Emplacement, number> = {
  carte_synthese: 420,
  carte_pourquoi: 280,
  capacite: 80,
  monde_accroche: 320,
  monde_pourquoi: 280,
};

/** Ce qu'on dit à Claude (écriture et seconde passe) de la longueur attendue. */
export const LONGUEUR_ATTENDUE: Record<Emplacement, string> = {
  carte_synthese: "ouverture : deux phrases au plus ; chaque bloc : deux ou trois phrases",
  carte_pourquoi: "une phrase, deux au plus",
  capacite: "six à dix mots, à la première personne, sans point final",
  monde_accroche: "une ou deux phrases",
  monde_pourquoi: "une phrase",
};

const MOTS_INTERDITS = [/empowerment/i, /bienveillant/i, /transformation/i];

function normaliser(t: string): string {
  return t
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Les passages entre guillemets français. */
export function citations(texte: string): string[] {
  return [...texte.matchAll(/«\s*([^»]+?)\s*»/g)].map((m) => m[1]);
}

export type Verdict = { ok: true } | { ok: false; regle: number; raison: string };

/**
 * @param textes   les morceaux du texte écrit (un seul, ou les quatre blocs de la synthèse)
 * @param sources  ses réponses, mot pour mot : toute citation doit s'y trouver
 * @param citationsPermises  nombre de citations autorisées (une au plus pour la synthèse)
 */
export function verifierRegles(
  emplacement: Emplacement,
  textes: string[],
  sources: string[],
  sujetsAEviter: string | null | undefined,
  citationsPermises = 3,
): Verdict {
  const tout = textes.join(" ");
  if (!textes.length || textes.some((t) => !t || !t.trim())) return { ok: false, regle: 7, raison: "texte vide" };

  for (const re of MOTS_INTERDITS) if (re.test(tout)) return { ok: false, regle: 6, raison: "mot interdit" };
  if (/[—–]/.test(tout)) return { ok: false, regle: 6, raison: "tiret cadratin" };

  const cites = citations(tout);
  if (cites.length > citationsPermises) return { ok: false, regle: 1, raison: "trop de citations" };
  const corpus = normaliser(sources.join("\n"));
  for (const c of cites) {
    if (!corpus.includes(normaliser(c))) return { ok: false, regle: 1, raison: "citation introuvable dans ses réponses" };
  }

  if (toucheSujet(racinesAEviter(sujetsAEviter), tout)) return { ok: false, regle: 5, raison: "sujet à éviter" };

  const max = LONGUEUR_MAX[emplacement];
  if (textes.some((t) => t.length > max)) return { ok: false, regle: 7, raison: "trop long" };

  return { ok: true };
}

/** Une capacité, de « Regarder ses comptes sans honte » à « Regarder mes comptes sans honte ». */
export function capaciteALaPremierePersonne(libelle: string): string {
  return libelle
    .replace(/\bses\b/g, "mes")
    .replace(/\bsa\b/g, "ma")
    .replace(/\bson\b/g, "mon")
    .replace(/\bsoi\b/g, "moi")
    .replace(/\bs'/g, "m'")
    .replace(/\bse\b/g, "me")
    .replace(/^Se /, "Me ")
    .replace(/^S'/, "M'")
    .replace(/\s*\.$/, "");
}
