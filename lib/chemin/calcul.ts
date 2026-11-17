/**
 * Le calcul du chemin : le cœur du produit.
 *
 * Module pur : aucune base de données, aucun appel réseau. Les deux décisions qui demandent
 * de lire ses mots (départager une égalité, compléter une capacité) sont confiées à des
 * fonctions passées en paramètre. Côté serveur, ce sont des appels à Claude ; dans les tests,
 * des fonctions écrites à la main.
 *
 * Règles : BRIEF.md, « Le calcul du chemin ».
 */
import {
  MONDES,
  QUETES,
  codesDe,
  isCode,
  isQueteId,
  type CodeCapacite,
  type MondeId,
  type QueteId,
} from "@/lib/questionnaire/contenu";

/** Valeur d'un curseur qu'elle n'a pas touché. */
export const CURSEUR_PAR_DEFAUT = 3;

export type Positions = Partial<Record<QueteId, { ou?: number; envie?: number }>>;

export type ZoomReponses = Partial<
  Record<
    QueteId,
    {
      choisies?: string[];
      intensite?: Partial<Record<string, number>>;
      autrement?: string;
    }
  >
>;

export type EntreeChemin = {
  positions: Positions;
  /** Sa réponse à « Laquelle t'appelle le plus, et pourquoi ? » */
  appelle?: string;
  zoom: ZoomReponses;
};

/** Lit sa réponse ouverte et renvoie la quête nommée ou évoquée parmi les candidates, ou null. */
export type Departage = (texte: string, candidates: QueteId[]) => Promise<QueteId | null>;

/** Choisit `nombre` capacités de la quête, hors `exclues`, à partir de ses réponses ouvertes. */
export type ChoixCapacites = (demande: {
  quete: QueteId;
  exclues: CodeCapacite[];
  nombre: number;
}) => Promise<CodeCapacite[]>;

export type Dependances = {
  departage: Departage;
  choisirCapacites: ChoixCapacites;
};

export type Chemin = {
  /** Mois 1, 2, 3. */
  quetes: [QueteId, QueteId, QueteId];
  /** Capacité 1 (semaine 1), capacité 2 (semaine 3). */
  capacites: Record<QueteId, [CodeCapacite, CodeCapacite]>;
  mondes: [MondeId, MondeId, MondeId];
};

// ---------------------------------------------------------------------------
// 1. Le score d'une quête
// ---------------------------------------------------------------------------

function borne(v: number | undefined): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return CURSEUR_PAR_DEFAUT;
  return Math.min(5, Math.max(1, Math.round(v)));
}

export function position(positions: Positions, q: QueteId): { ou: number; envie: number } {
  return { ou: borne(positions[q]?.ou), envie: borne(positions[q]?.envie) };
}

/** (6 moins « où j'en suis ») multiplié par « mon envie ». De 1 à 25. */
export function score(ou: number, envie: number): number {
  return (6 - borne(ou)) * borne(envie);
}

export function scoreDe(positions: Positions, q: QueteId): number {
  const p = position(positions, q);
  return score(p.ou, p.envie);
}

/**
 * Les 7 quêtes, de la plus haute à la plus basse.
 * Égalité : l'envie la plus haute, puis le « où j'en suis » le plus bas, puis l'ordre des specs.
 */
export function classement(positions: Positions): QueteId[] {
  return [...QUETES].sort((a, b) => {
    const pa = position(positions, a);
    const pb = position(positions, b);
    return (
      score(pb.ou, pb.envie) - score(pa.ou, pa.envie) ||
      pb.envie - pa.envie ||
      pa.ou - pb.ou ||
      QUETES.indexOf(a) - QUETES.indexOf(b)
    );
  });
}

// ---------------------------------------------------------------------------
// 2. Le zoom : les 3 meilleurs scores, ou 4 en cas d'égalité au 3e rang
// ---------------------------------------------------------------------------

export function quetesDuZoom(positions: Positions): QueteId[] {
  const c = classement(positions);
  const troisieme = scoreDe(positions, c[2]);
  return scoreDe(positions, c[3]) === troisieme ? c.slice(0, 4) : c.slice(0, 3);
}

// ---------------------------------------------------------------------------
// 3. Les 3 quêtes
// ---------------------------------------------------------------------------

export async function troisQuetes(
  positions: Positions,
  appelle: string | undefined,
  departage: Departage,
): Promise<QueteId[]> {
  const c = classement(positions);
  const seuil = scoreDe(positions, c[2]);
  const sures = c.filter((q) => scoreDe(positions, q) > seuil);
  const egales = c.filter((q) => scoreDe(positions, q) === seuil);
  const places = 3 - sures.length;

  if (egales.length <= places) return [...sures, ...egales];

  // Égalité : sa réponse ouverte départage. Sinon, l'ordre du classement
  // (l'envie la plus haute, puis le « où j'en suis » le plus bas).
  let nommee: QueteId | null = null;
  if (appelle && appelle.trim()) {
    try {
      const r = await departage(appelle, egales);
      if (isQueteId(r) && egales.includes(r)) nommee = r;
    } catch {
      nommee = null;
    }
  }
  const departagees = nommee ? [nommee, ...egales.filter((q) => q !== nommee)] : egales;
  return [...sures, ...departagees.slice(0, places)];
}

// ---------------------------------------------------------------------------
// 4. L'ordre
// ---------------------------------------------------------------------------

/**
 * Mois 1 : la quête où son envie est la plus haute.
 * Mois 2 : parmi les deux autres, celle où elle se sent le plus loin (« où j'en suis » le plus bas).
 * Mois 3 : la dernière. Égalité : le score départage, puis le classement.
 */
export function ordonner(trois: QueteId[], positions: Positions): [QueteId, QueteId, QueteId] {
  if (trois.length !== 3 || new Set(trois).size !== 3) {
    throw new Error("Il faut exactement trois quêtes différentes.");
  }
  const rang = classement(positions);
  const parScore = (a: QueteId, b: QueteId) =>
    scoreDe(positions, b) - scoreDe(positions, a) || rang.indexOf(a) - rang.indexOf(b);

  const mois1 = [...trois].sort(
    (a, b) => position(positions, b).envie - position(positions, a).envie || parScore(a, b),
  )[0];
  const restantes = trois.filter((q) => q !== mois1);
  const mois2 = [...restantes].sort(
    (a, b) => position(positions, a).ou - position(positions, b).ou || parScore(a, b),
  )[0];
  const mois3 = restantes.find((q) => q !== mois2)!;
  return [mois1, mois2, mois3];
}

// ---------------------------------------------------------------------------
// 5. Les 2 capacités de chaque quête
// ---------------------------------------------------------------------------

export async function capacitesDe(
  quete: QueteId,
  zoom: ZoomReponses,
  choisir: ChoixCapacites,
): Promise<[CodeCapacite, CodeCapacite]> {
  const permis = codesDe(quete);
  const z = zoom[quete];
  const intensite = z?.intensite ?? {};

  // Celles cochées au zoom (deux au plus). La plus forte d'abord : elle ouvre le mois.
  const cochees = [...new Set((z?.choisies ?? []).filter(isCode))]
    .filter((c) => permis.includes(c))
    .slice(0, 2)
    .sort((a, b) => (intensite[b] ?? 0) - (intensite[a] ?? 0) || permis.indexOf(a) - permis.indexOf(b));

  const resultat: CodeCapacite[] = [...cochees];

  if (resultat.length < 2) {
    let proposees: CodeCapacite[] = [];
    try {
      proposees = await choisir({ quete, exclues: [...resultat], nombre: 2 - resultat.length });
    } catch {
      proposees = [];
    }
    for (const c of proposees) {
      if (resultat.length >= 2) break;
      if (isCode(c) && permis.includes(c) && !resultat.includes(c)) resultat.push(c);
    }
  }

  // Filet de sécurité : si rien d'exploitable n'est revenu, l'ordre des specs.
  for (const c of permis) {
    if (resultat.length >= 2) break;
    if (!resultat.includes(c)) resultat.push(c);
  }

  return [resultat[0], resultat[1]];
}

// ---------------------------------------------------------------------------
// 6. Le chemin complet
// ---------------------------------------------------------------------------

/** Mondes fixes pour la V0 : Histoire, puis Philosophie pratique, puis Attention et réseaux. */
export const MONDES_V0: [MondeId, MondeId, MondeId] = [MONDES[0], MONDES[1], MONDES[2]];

async function capacitesPour(
  quetes: QueteId[],
  zoom: ZoomReponses,
  choisir: ChoixCapacites,
  dejaConnues: Partial<Record<QueteId, [CodeCapacite, CodeCapacite]>> = {},
) {
  const paires = await Promise.all(
    quetes.map(async (q) => [q, dejaConnues[q] ?? (await capacitesDe(q, zoom, choisir))] as const),
  );
  return Object.fromEntries(paires) as Record<QueteId, [CodeCapacite, CodeCapacite]>;
}

export async function calculerChemin(entree: EntreeChemin, deps: Dependances): Promise<Chemin> {
  const trois = await troisQuetes(entree.positions, entree.appelle, deps.departage);
  const quetes = ordonner(trois, entree.positions);
  const capacites = await capacitesPour(quetes, entree.zoom, deps.choisirCapacites);
  return { quetes, capacites, mondes: MONDES_V0 };
}

// ---------------------------------------------------------------------------
// 7. Échanger une quête
// ---------------------------------------------------------------------------

/** La quête proposée par défaut pour un échange : la meilleure qui n'est pas déjà dans le chemin. */
export function quatriemeMeilleure(positions: Positions, quetes: QueteId[]): QueteId {
  return classement(positions).find((q) => !quetes.includes(q))!;
}

export async function echangerQuete(
  chemin: Chemin,
  sortante: QueteId,
  entrante: QueteId | undefined,
  entree: EntreeChemin,
  deps: Pick<Dependances, "choisirCapacites">,
): Promise<Chemin> {
  if (!chemin.quetes.includes(sortante)) throw new Error("Cette quête n'est pas dans le chemin.");
  const nouvelle = entrante ?? quatriemeMeilleure(entree.positions, chemin.quetes);
  if (!isQueteId(nouvelle) || chemin.quetes.includes(nouvelle)) {
    throw new Error("Cette quête est déjà dans le chemin.");
  }
  const trois = chemin.quetes.map((q) => (q === sortante ? nouvelle : q));
  const quetes = ordonner(trois, entree.positions);
  const gardees = Object.fromEntries(
    Object.entries(chemin.capacites).filter(([q]) => q !== sortante),
  ) as Partial<Record<QueteId, [CodeCapacite, CodeCapacite]>>;
  const capacites = await capacitesPour(quetes, entree.zoom, deps.choisirCapacites, gardees);
  return { quetes, capacites, mondes: MONDES_V0 };
}
