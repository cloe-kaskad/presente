/**
 * Les chiffres de la page de l'équipe (brief V0.10), calculés à partir des étapes notées.
 * Uniquement des totaux : aucune ligne ne renvoie à une personne.
 */

export type Evenement = { user_id: string; type: string; semaine: number | null; cle: string | null; jour: string; created_at: string };

const personnes = (evs: Evenement[]) => new Set(evs.map((e) => e.user_id)).size;
const DIX = 864e5;
const joursEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DIX);

export type LigneEntonnoir = { libelle: string; nombre: number; part: number | null };

const ETAPES_PARCOURS: [string, string][] = [
  ["questionnaire_commence", "Ont commencé le questionnaire"],
  ["questionnaire_termine", "L'ont terminé"],
  ["carte_vue", "Ont vu leur carte"],
  ["chemin_commence", "Ont commencé leur chemin"],
];

export function entonnoir(evs: Evenement[]): LigneEntonnoir[] {
  const lignes: { libelle: string; nombre: number }[] = ETAPES_PARCOURS.map(([t, libelle]) => ({ libelle, nombre: personnes(evs.filter((e) => e.type === t)) }));
  const ouvertes = evs.filter((e) => e.type === "semaine_ouverte");
  const derniere = Math.max(0, ...ouvertes.map((e) => e.semaine ?? 0));
  for (let n = 1; n <= Math.max(1, derniere); n++) lignes.push({ libelle: `Ont ouvert la semaine ${n}`, nombre: personnes(ouvertes.filter((e) => e.semaine === n)) });
  return lignes.map((l, i) => ({ ...l, part: i === 0 || !lignes[i - 1].nombre ? null : Math.round((100 * l.nombre) / lignes[i - 1].nombre) }));
}

export type LigneSemaine = { semaine: number; ouverte: number; ecoute: number; carnet: number; exerciceCree: number; exerciceTermine: number; fil: number };

export function dansLesSemaines(evs: Evenement[]): LigneSemaine[] {
  const semaines = [...new Set(evs.filter((e) => e.type === "semaine_ouverte" && e.semaine).map((e) => e.semaine as number))].sort((a, b) => a - b);
  const compte = (n: number, t: string) => personnes(evs.filter((e) => e.type === t && e.semaine === n));
  return semaines.map((n) => ({
    semaine: n,
    ouverte: compte(n, "semaine_ouverte"),
    ecoute: compte(n, "contenu_ecoute"),
    carnet: compte(n, "carnet_ecrit"),
    exerciceCree: compte(n, "exercice_cree"),
    exerciceTermine: compte(n, "exercice_termine"),
    fil: compte(n, "fil_lu"),
  }));
}

export type Decrochage = { total: number; sept: number; quatorze: number; ouEllesEnEtaient: { semaine: number; nombre: number }[] };

export function decrochage(evs: Evenement[], aujourdhui: string): Decrochage {
  const parPersonne = new Map<string, Evenement[]>();
  for (const e of evs) parPersonne.set(e.user_id, [...(parPersonne.get(e.user_id) ?? []), e]);
  let sept = 0;
  let quatorze = 0;
  const ou = new Map<number, number>();
  for (const liste of parPersonne.values()) {
    const dernier = liste.map((e) => e.jour).sort().at(-1) ?? aujourdhui;
    const silence = joursEntre(dernier, aujourdhui);
    if (silence >= 7) {
      sept++;
      const s = Math.max(0, ...liste.filter((e) => e.type === "semaine_ouverte").map((e) => e.semaine ?? 0));
      ou.set(s, (ou.get(s) ?? 0) + 1);
    }
    if (silence >= 14) quatorze++;
  }
  return { total: parPersonne.size, sept, quatorze, ouEllesEnEtaient: [...ou.entries()].sort((a, b) => a[0] - b[0]).map(([semaine, nombre]) => ({ semaine, nombre })) };
}

const mediane = (xs: number[]) => {
  if (!xs.length) return null;
  const t = [...xs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
};

export type Rythme = { joursEntreDeuxSemaines: number | null; visitesSur7Jours: number | null };

export function rythme(evs: Evenement[], aujourdhui: string): Rythme {
  const ecarts: number[] = [];
  const parPersonne = new Map<string, Evenement[]>();
  for (const e of evs) parPersonne.set(e.user_id, [...(parPersonne.get(e.user_id) ?? []), e]);
  const visites: number[] = [];
  for (const liste of parPersonne.values()) {
    const ouvertures = liste
      .filter((e) => e.type === "semaine_ouverte" && e.semaine)
      .sort((a, b) => (a.semaine as number) - (b.semaine as number))
      .map((e) => e.jour);
    for (let i = 1; i < ouvertures.length; i++) ecarts.push(joursEntre(ouvertures[i - 1], ouvertures[i]));
    const jours = new Set(liste.filter((e) => e.type === "visite" && joursEntre(e.jour, aujourdhui) < 7).map((e) => e.jour));
    visites.push(jours.size);
  }
  return {
    joursEntreDeuxSemaines: mediane(ecarts),
    visitesSur7Jours: visites.length ? Math.round((10 * visites.reduce((a, b) => a + b, 0)) / visites.length) / 10 : null,
  };
}

export type Rituel = { joursDeVisite: number; humeur: number | null; questionCherie: number | null; article: number | null };

export function rituel(evs: Evenement[]): Rituel {
  const cle = (e: Evenement) => `${e.user_id}|${e.jour}`;
  const visites = new Set(evs.filter((e) => e.type === "visite").map(cle));
  const part = (t: string) => {
    if (!visites.size) return null;
    const avec = new Set(evs.filter((e) => e.type === t).map(cle));
    return Math.round((100 * [...visites].filter((v) => avec.has(v)).length) / visites.size);
  };
  return { joursDeVisite: visites.size, humeur: part("humeur_notee"), questionCherie: part("question_cherie_repondue"), article: part("article_ouvert") };
}

export type AvisParContenu = { titre: string; total: number; choix: Record<string, number> };

/**
 * Les avis par contenu : le dernier avis de chaque personne pour chaque semaine, rapporté au contenu de cette
 * semaine-là dans son chemin (`contenuDe`).
 */
export function avisParContenu(evs: Evenement[], contenuDe: (userId: string, semaine: number) => string | null): AvisParContenu[] {
  const dernier = new Map<string, Evenement>();
  for (const e of evs.filter((x) => x.type === "avis_donne" && x.semaine && x.cle).sort((a, b) => (a.created_at < b.created_at ? -1 : 1))) {
    dernier.set(`${e.user_id}|${e.semaine}`, e);
  }
  const parContenu = new Map<string, AvisParContenu>();
  for (const e of dernier.values()) {
    const titre = contenuDe(e.user_id, e.semaine as number) ?? `Semaine ${e.semaine}`;
    const a = parContenu.get(titre) ?? { titre, total: 0, choix: {} };
    a.total++;
    a.choix[e.cle as string] = (a.choix[e.cle as string] ?? 0) + 1;
    parContenu.set(titre, a);
  }
  return [...parContenu.values()].sort((a, b) => b.total - a.total || a.titre.localeCompare(b.titre, "fr"));
}
