/**
 * Le choix d'un contenu et d'un exercice pour une semaine de quête.
 * Module pur, testé. Plan produit, « Comment le chemin se compose » :
 * d'abord on écarte, ensuite on classe ce qui reste.
 */
import type { FormatId, QueteId, TempsId } from "@/lib/questionnaire/contenu";
import { racinesAEviter, situationsDecrites, supposeAutreChose, toucheSujet } from "./filtres";
import type { Catalogue, Contenu, Pratique, Temps } from "./types";

export type ProfilChoix = {
  temps?: TempsId;
  formats: FormatId[];
  sujetsAEviter?: string | null;
  /** Ses réponses ouvertes, pour savoir quelles situations elle a décrites. */
  sesMots: string;
  /** Trois jours lourds de suite dans son journal : on préfère un contenu doux. */
  douceur?: boolean;
  /** Ses avis sur les contenus déjà proposés (« Ce contenu, pour toi ? »), avec le mot libre. */
  avis?: AvisContenu[];
};

export type RetourId = "parle" | "pas_mal" | "moyen" | "pas_maintenant" | "pas_pour_moi";

export type AvisContenu = {
  retour: RetourId;
  auteur: string;
  registre: string | null;
  format: FormatId | null;
  /** Son mot libre, facultatif. Il ne sert qu'ici, au calcul : jamais affiché ailleurs que dans son carnet, jamais dans les logs. */
  mot: string;
};

// ---------------------------------------------------------------------------
// Ses avis
// ---------------------------------------------------------------------------

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'");

const VISE_LA_PERSONNE = /(autrice|auteure|auteur|ecrivaine|journaliste|animatrice|invitee|cette femme|cet homme|cette personne|sa voix|son ton|sa facon|elle m'|il m')/;
const NEGATIF = /(n'?accroche pas|accroche pas|pas accroche|n'aime pas|aime pas|agace|supporte pas|insupportable|pas fan|du mal avec|pas pour moi|bof|ennuie|enerve)/;

export type LectureDesAvis = {
  /** Autrices et auteurs à ne plus proposer. */
  auteursEcartes: string[];
  /** Points par autrice, par registre et par format. */
  auteurs: Map<string, number>;
  registres: Map<string, number>;
  formats: Map<string, number>;
  longueur: "plus_long" | "plus_court" | null;
  moinsTheorique: boolean;
  plusDoux: boolean;
};

/** Ce que ses avis et ses mots disent pour la suite. Module pur, testé. */
export function lireLesAvis(avis: AvisContenu[] = []): LectureDesAvis {
  const l: LectureDesAvis = { auteursEcartes: [], auteurs: new Map(), registres: new Map(), formats: new Map(), longueur: null, moinsTheorique: false, plusDoux: false };
  const ajoute = (m: Map<string, number>, cle: string | null, n: number) => {
    if (cle) m.set(cle, (m.get(cle) ?? 0) + n);
  };
  const POIDS: Record<RetourId, number> = { parle: 2, pas_mal: 1, moyen: -1, pas_maintenant: 0, pas_pour_moi: -6 };
  for (const a of avis) {
    const auteur = normal(a.auteur).trim();
    ajoute(l.auteurs, auteur, POIDS[a.retour]);
    ajoute(l.registres, a.registre, a.retour === "parle" ? 1 : a.retour === "pas_pour_moi" ? -2 : 0);
    ajoute(l.formats, a.format, a.retour === "parle" ? 1 : a.retour === "pas_pour_moi" ? -1 : 0);
    const mot = normal(a.mot);
    if (!mot.trim()) continue;
    if (auteur && VISE_LA_PERSONNE.test(mot) && (NEGATIF.test(mot) || a.retour === "pas_pour_moi")) l.auteursEcartes.push(auteur);
    if (/trop court/.test(mot)) l.longueur = "plus_long";
    if (/trop long/.test(mot)) l.longueur = "plus_court";
    if (/(theorique|abstrait|intello|trop de concepts)/.test(mot)) l.moinsTheorique = true;
    if (/(trop dur|trop violent|trop lourd|trop fort|trop intense|ca m'a remuee)/.test(mot)) l.plusDoux = true;
  }
  return l;
}

const memeAuteur = (ecarte: string, auteur: string) => {
  const a = normal(auteur).trim();
  return Boolean(a) && (a === ecarte || a.includes(ecarte) || ecarte.includes(a));
};

export type DemandeSemaine = {
  quete: QueteId;
  /** Semaine 1 du mois : capacité 1, rôle « ouvrir ». Semaine 3 : capacité 2, rôle « agir ». */
  semaine: 1 | 3;
  capacites: [string, string];
  /** Identifiants déjà proposés ailleurs dans son chemin : jamais deux fois. */
  dejaPris?: string[];
  /** Le contenu de la semaine de quête précédente, pour varier. */
  precedent?: Pick<Contenu, "auteur" | "registre" | "type"> | null;
};

// ---------------------------------------------------------------------------
// Le temps
// ---------------------------------------------------------------------------

/** Les durées acceptées, de la plus stricte à la plus souple. */
function paliersDeTemps(temps: TempsId | undefined): Temps[][] {
  if (temps === "30min") return [["court"], ["court", "moyen", "a_verifier"]];
  if (temps === "1h") return [["court", "moyen", "a_verifier"], ["court", "moyen", "a_verifier", "long"]];
  return [["court", "moyen", "long", "a_verifier"]];
}

/** Un livre ou une série avec une « entrée courte » compte comme moyen. */
function tempsEffectif(c: Contenu): Temps {
  if (c.temps === "long" && c.entreeCourte?.trim()) return "moyen";
  return c.temps ?? "a_verifier";
}

// ---------------------------------------------------------------------------
// Le contenu
// ---------------------------------------------------------------------------

function noteContenu(c: Contenu, d: DemandeSemaine, p: ProfilChoix, cible: string, avis: LectureDesAvis): number {
  let n = 0;
  // Ses avis : la même autrice, le même registre, le même format qu'un contenu qu'elle a aimé ou pas.
  n += avis.auteurs.get(normal(c.auteur).trim()) ?? 0;
  if (c.registre) n += avis.registres.get(c.registre) ?? 0;
  if (c.format) n += avis.formats.get(c.format) ?? 0;
  const t = tempsEffectif(c);
  if (avis.longueur === "plus_long") n += t === "moyen" || t === "long" ? 2 : t === "court" ? -2 : 0;
  if (avis.longueur === "plus_court") n += t === "court" ? 2 : t === "long" ? -2 : 0;
  if (avis.moinsTheorique && c.role === "comprendre") n -= 2;
  if (avis.plusDoux) n += c.intensite === "douce" ? 3 : c.intensite === "bousculante" ? -3 : 0;
  if (c.format && p.formats.includes(c.format)) n += 4;
  const roleVoulu = d.semaine === 1 ? "ouvrir" : "agir";
  if (c.role === roleVoulu) n += 3;
  else if (c.role === "comprendre") n += 1;
  if (d.semaine === 1) n += c.intensite === "douce" ? 2 : c.intensite === "franche" ? 1 : 0;
  else n += c.intensite === "franche" ? 2 : c.intensite === "douce" ? 1 : 0;
  if (p.douceur) n += c.intensite === "douce" ? 10 : c.intensite === "bousculante" ? -10 : 0;
  if (c.capacites[0] === cible) n += 1;
  if (c.acces === "Gratuit") n += 1;
  if (p.temps === "30min" && tempsEffectif(c) === "court") n += 1;
  if (d.precedent) {
    if (d.precedent.auteur && c.auteur === d.precedent.auteur) n -= 10; // jamais deux fois de suite la même voix, sauf s'il n'y a rien d'autre
    if (d.precedent.registre && c.registre === d.precedent.registre) n -= 1;
    if (d.precedent.type && c.type === d.precedent.type) n -= 1;
  }
  return n;
}

function meilleur<T extends { id: string }>(items: T[], note: (x: T) => number, nom: (x: T) => string): T | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => note(b) - note(a) || nom(a).localeCompare(nom(b), "fr") || a.id.localeCompare(b.id))[0];
}

export type ChoixContenu = { contenu: Contenu | null; capacite: string | null };

export function choisirContenu(catalogue: Catalogue, d: DemandeSemaine, p: ProfilChoix): ChoixContenu {
  const aEviter = racinesAEviter(p.sujetsAEviter);
  const situations = situationsDecrites(p.sesMots);
  const pris = new Set(d.dejaPris ?? []);
  const avis = lireLesAvis(p.avis);
  const [cap1, cap2] = d.capacites;
  const cible = d.semaine === 1 ? cap1 : cap2;
  const autre = d.semaine === 1 ? cap2 : cap1;

  // D'abord on écarte, sans jamais assouplir.
  const sains = catalogue.contenus.filter(
    (c) =>
      !pris.has(c.id) &&
      !avis.auteursEcartes.some((a) => memeAuteur(a, c.auteur)) &&
      !toucheSujet(aEviter, c.aEviterSi, c.titre, c.description, c.pourquoi) &&
      !supposeAutreChose(c.supposeQue, situations),
  );

  // La capacité du moment, puis l'autre capacité du mois, puis la quête.
  const niveaux: { capacite: string | null; garder: (c: Contenu) => boolean }[] = [
    { capacite: cible, garder: (c) => c.capacites.includes(cible) },
    { capacite: autre, garder: (c) => c.capacites.includes(autre) },
    { capacite: null, garder: (c) => c.quete === d.quete },
  ];

  for (const niveau of niveaux) {
    const candidats = sains.filter(niveau.garder);
    for (const durees of paliersDeTemps(p.temps)) {
      const dansLeTemps = candidats.filter((c) => durees.includes(tempsEffectif(c)));
      const c = meilleur(dansLeTemps, (x) => noteContenu(x, d, p, cible, avis), (x) => x.titre);
      if (c) return { contenu: c, capacite: niveau.capacite };
    }
  }
  return { contenu: null, capacite: null };
}

// ---------------------------------------------------------------------------
// L'exercice (semaine 1) et l'acte (semaine 3)
// ---------------------------------------------------------------------------

function notePratique(x: Pratique, d: DemandeSemaine): number {
  let n = 0;
  if (d.semaine === 1) n += x.intensite === "douce" ? 2 : x.intensite === "franche" ? 1 : 0;
  else n += x.intensite === "franche" ? 2 : x.intensite === "douce" ? 1 : 0;
  if (d.semaine === 3 && x.formeReponse === "Acte réel puis retour") n += 2;
  if (d.semaine === 1 && x.formeReponse !== "Acte réel puis retour") n += 1;
  return n;
}

export type ChoixPratique = { pratique: Pratique | null; capacite: string | null };

export function choisirPratique(catalogue: Catalogue, d: DemandeSemaine, p: ProfilChoix): ChoixPratique {
  const aEviter = racinesAEviter(p.sujetsAEviter);
  const pris = new Set(d.dejaPris ?? []);
  const [cap1, cap2] = d.capacites;
  const cible = d.semaine === 1 ? cap1 : cap2;
  const autre = d.semaine === 1 ? cap2 : cap1;
  const role = d.semaine === 1 ? "ouvrir" : "agir";

  const sains = catalogue.pratiques.filter(
    (x) =>
      x.role === role &&
      !pris.has(x.id) &&
      !toucheSujet(aEviter, x.nom, x.enBref, x.consigne),
  );

  const niveaux: { capacite: string | null; garder: (x: Pratique) => boolean }[] = [
    { capacite: cible, garder: (x) => x.capacites.includes(cible) },
    { capacite: autre, garder: (x) => x.capacites.includes(autre) },
    { capacite: null, garder: (x) => x.quete === d.quete },
  ];
  for (const niveau of niveaux) {
    const x = meilleur(sains.filter(niveau.garder), (y) => notePratique(y, d), (y) => y.nom);
    if (x) return { pratique: x, capacite: niveau.capacite };
  }
  return { pratique: null, capacite: null };
}
