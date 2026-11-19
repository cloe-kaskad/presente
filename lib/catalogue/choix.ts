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

function noteContenu(c: Contenu, d: DemandeSemaine, p: ProfilChoix, cible: string): number {
  let n = 0;
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
  const [cap1, cap2] = d.capacites;
  const cible = d.semaine === 1 ? cap1 : cap2;
  const autre = d.semaine === 1 ? cap2 : cap1;

  // D'abord on écarte, sans jamais assouplir.
  const sains = catalogue.contenus.filter(
    (c) =>
      !pris.has(c.id) &&
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
      const c = meilleur(dansLeTemps, (x) => noteContenu(x, d, p, cible), (x) => x.titre);
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
