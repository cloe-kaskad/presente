/**
 * Les règles du moteur d'écriture qu'on peut vérifier sans Claude.
 * Elles passent avant la seconde passe. Un texte qui échoue est réécrit une fois par Claude,
 * avec la raison du refus ; s'il échoue encore, le texte de secours le remplace.
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
  carte_synthese: 600,
  carte_pourquoi: 420,
  capacite: 90,
  monde_accroche: 480,
  monde_pourquoi: 380,
};

/** Ce qu'on dit à Claude (écriture et seconde passe) de la longueur attendue. */
export const LONGUEUR_ATTENDUE: Record<Emplacement, string> = {
  carte_synthese:
    "ouverture : deux phrases au plus ; chaque bloc : deux ou trois phrases ; 500 caractères au plus par bloc ; une seule citation entre guillemets dans tout le texte",
  carte_pourquoi: "une phrase, deux au plus, 350 caractères au plus",
  capacite: "six à dix mots, à la première personne, sans point final, sans guillemets",
  monde_accroche: "une ou deux phrases, 400 caractères au plus",
  monde_pourquoi: "une phrase, 300 caractères au plus",
};

const MOTS_INTERDITS = [/empowerment/i, /bienveillant/i, /transformation/i];

/**
 * Pour comparer une citation à ses réponses : sans majuscules, sans ponctuation, espaces réduits.
 * « J’ai honte, de mes comptes. » et « j'ai honte de mes comptes » sont la même citation ;
 * un mot changé, ajouté ou retiré ne l'est pas.
 */
function normaliser(t: string): string {
  return ` ${t
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
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
    // Une citation coupée par des points de suspension : chaque morceau doit exister.
    const morceaux = c.split(/…|\.\.\.|\[…\]/).map(normaliser).filter((m) => m.trim());
    if (!morceaux.length || morceaux.some((m) => !corpus.includes(m))) {
      return { ok: false, regle: 1, raison: "citation introuvable dans ses réponses" };
    }
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

/** Vrai si la citation figure mot pour mot dans ses réponses (sans majuscules ni ponctuation). */
export function citationExacte(c: string, sources: string[]): boolean {
  const corpus = normaliser(sources.join("\n"));
  const morceaux = c.split(/…|\.\.\.|\[…\]/).map(normaliser).filter((m) => m.trim());
  return morceaux.length > 0 && morceaux.every((m) => corpus.includes(m));
}

/**
 * « Tes mots, qu'on a gardés » : on ne garde que les citations exactes, courtes,
 * qui ne touchent aucun sujet à éviter. Quatre au plus, sans doublon.
 */
export function garderMotsExacts(
  mots: string[],
  sources: string[],
  sujetsAEviter: string | null | undefined,
  max = 4,
): string[] {
  const aEviter = racinesAEviter(sujetsAEviter);
  const gardes: string[] = [];
  for (const brut of mots) {
    const m = brut.trim().replace(/^[«"“]\s*|\s*[»"”]$/g, "").replace(/[.,;:\s]+$/, "").trim();
    if (!m || m.length > 90) continue;
    if (!citationExacte(m, sources) || toucheSujet(aEviter, m)) continue;
    if (gardes.some((g) => normaliser(g) === normaliser(m))) continue;
    gardes.push(m);
    if (gardes.length >= max) break;
  }
  return gardes;
}
