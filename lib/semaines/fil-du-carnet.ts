/**
 * Le carnet en fil daté (brief V0.7) : les notes regroupées par semaine du chemin, la plus récente en haut.
 * Chaque note a une date et une origine, déduites du code de l'entrée (aucune colonne ajoutée).
 */
import { jourAParis } from "@/lib/rituel/citations";

export type Categorie = "contenus" | "exercices" | "jour";

export type EntreeDuCarnet = {
  semaine: number;
  code: string;
  question: string;
  reponse: string;
  retour: string | null;
  creee: string;
};

/** Ce qu'on sait de chaque semaine pour dire d'où vient une note. */
export type InfoSemaine = {
  titre: string;
  contenu?: { titre: string; type: string } | null; // semaines 1 et 3
  episode?: string | null; // semaines 2 et 4
  pratique?: { nom: string; agir: boolean; total: number | null } | null;
};

export type Note = {
  cle: string;
  jour: string; // AAAA-MM-JJ
  origine: string;
  categorie: Categorie;
  pastille: string | null;
  lignes: { question: string; reponse: string }[];
};

export type SemaineDuCarnet = { n: number; titre: string; cetteSemaine: boolean; premier: string; dernier: string; notes: Note[] };

type Origine = "avant" | "apres" | "pratique" | "palier" | "echo" | "qc";

function origineDuCode(code: string): Origine {
  if (code.startsWith("echo:")) return "echo";
  if (code.startsWith("qc:")) return "qc";
  const reste = code.split(":").slice(1).join(":");
  if (/^(exo|acte|decale)(:|$)/.test(reste)) return "pratique";
  if (reste.startsWith("palier")) return "palier";
  if (reste.startsWith("avant")) return "avant";
  return "apres";
}

const jourDe = (e: EntreeDuCarnet) => {
  const enCode = e.code.match(/(\d{4}-\d{2}-\d{2})$/);
  if (enCode && (e.code.startsWith("echo:") || e.code.includes(":exo:jour:"))) return enCode[1];
  return jourAParis(new Date(e.creee));
};

function libelle(o: Origine, info: InfoSemaine | undefined): { texte: string; categorie: Categorie } {
  const contenu = info?.contenu;
  const objet = contenu ? `${contenu.type ? `le ${contenu.type.toLowerCase()} ` : ""}« ${contenu.titre} »` : info?.episode ? `l'épisode « ${info.episode} »` : "le contenu";
  switch (o) {
    case "avant":
      return { texte: `Avant ${objet}`, categorie: "contenus" };
    case "apres":
      return { texte: `Après ${objet}`, categorie: "contenus" };
    case "pratique":
      return { texte: info?.pratique ? `${info.pratique.agir ? "Geste" : "Exercice"} · ${info.pratique.nom}` : "Exercice", categorie: "exercices" };
    case "palier":
      return { texte: "Le palier du mois", categorie: "exercices" };
    case "echo":
      return { texte: "Écho du carnet", categorie: "jour" };
    case "qc":
      return { texte: "La Question Chérie", categorie: "jour" };
  }
}

/** La question telle qu'on l'affiche : sans le nom de l'exercice devant. */
function questionAffichee(e: EntreeDuCarnet, info: InfoSemaine | undefined): string {
  if (e.code.includes(":exo:jour:")) return "Ce que tu as noté ce jour-là.";
  if (/:decale$/.test(e.code)) return "Tu as choisi de le décaler.";
  if (/:retour$/.test(e.code)) return "Pourquoi, en un mot";
  // Les réponses d'exercice sont enregistrées « Nom de l'exercice · question » : on garde la question.
  if (/:exo:/.test(e.code) && e.question.includes(" · ")) return e.question.split(" · ").slice(1).join(" · ");
  const nom = info?.pratique?.nom;
  return nom && e.question.startsWith(`${nom} · `) ? e.question.slice(nom.length + 3) : e.question;
}

export function filDuCarnet(args: {
  entrees: EntreeDuCarnet[];
  infos: Record<number, InfoSemaine>;
  semaineCourante: number;
  retours: Record<string, string>;
}): SemaineDuCarnet[] {
  const { entrees, infos, semaineCourante, retours } = args;
  const parSemaine = new Map<number, Note[]>();
  // Dans l'ordre d'écriture, pour garder les questions d'une même note dans l'ordre.
  const triees = [...entrees].sort((a, b) => (a.creee < b.creee ? -1 : 1));
  const joursExercice = new Map<number, string[]>();
  for (const e of triees) {
    if (e.code.includes(":exo:jour:") && e.reponse.trim()) {
      const l = joursExercice.get(e.semaine) ?? [];
      l.push(jourDe(e));
      joursExercice.set(e.semaine, [...new Set(l)].sort());
    }
  }

  for (const e of triees) {
    const info = infos[e.semaine];
    const o = origineDuCode(e.code);
    const retour = e.retour ? retours[e.retour] : undefined;
    if (!e.reponse.trim() && !retour) continue;
    const notes = parSemaine.get(e.semaine) ?? [];
    parSemaine.set(e.semaine, notes);
    const jour = jourDe(e);
    const { texte, categorie } = libelle(o, info);
    const jourExo = e.code.includes(":exo:jour:");
    // Une note = une origine, un jour. L'avis sur un contenu rejoint la note « Après » de la semaine.
    const cle = o === "apres" ? `${e.semaine}:apres` : jourExo ? `${e.semaine}:${e.code}` : `${e.semaine}:${o}:${jour}`;
    let note = notes.find((x) => x.cle === cle);
    if (!note) {
      const total = info?.pratique?.total;
      const rang = jourExo ? (joursExercice.get(e.semaine) ?? []).indexOf(jour) + 1 : 0;
      note = { cle, jour, origine: texte, categorie, pastille: jourExo && total && rang ? `jour ${Math.min(rang, total)} sur ${total}` : null, lignes: [] };
      notes.push(note);
    }
    if (e.reponse.trim()) note.lignes.push({ question: questionAffichee(e, info), reponse: e.reponse.trim() });
    if (retour) note.pastille = retour;
  }

  return [...parSemaine.entries()]
    .map(([n, notes]) => {
      const gardees = notes.filter((x) => x.lignes.length || x.pastille);
      gardees.sort((a, b) => (a.jour === b.jour ? 0 : a.jour < b.jour ? 1 : -1));
      const jours = gardees.map((x) => x.jour).sort();
      return {
        n,
        titre: infos[n]?.titre ?? `Semaine ${n}`,
        cetteSemaine: n === semaineCourante,
        premier: jours[0] ?? "",
        dernier: jours[jours.length - 1] ?? "",
        notes: gardees,
      };
    })
    .filter((s) => s.notes.length)
    .sort((a, b) => b.n - a.n);
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « du 16 au 22 novembre », « du 30 octobre au 5 novembre », « le 19 novembre ». */
export function periode(premier: string, dernier: string): string {
  if (!premier) return "";
  const [, m1, j1] = premier.split("-").map(Number);
  const [, m2, j2] = dernier.split("-").map(Number);
  const jour = (j: number) => (j === 1 ? "1er" : String(j));
  if (premier === dernier) return `le ${jour(j1)} ${MOIS[m1 - 1]}`;
  if (m1 === m2) return `du ${jour(j1)} au ${jour(j2)} ${MOIS[m2 - 1]}`;
  return `du ${jour(j1)} ${MOIS[m1 - 1]} au ${jour(j2)} ${MOIS[m2 - 1]}`;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** « Jeudi 19 novembre » (téléphone) ou « Jeudi 19 nov. » (ordinateur). */
export function dateDeNote(jour: string, court = false): string {
  if (!jour) return "";
  const [a, m, j] = jour.split("-").map(Number);
  const js = new Date(Date.UTC(a, m - 1, j, 12)).getUTCDay();
  const mois = MOIS[m - 1];
  const nomJour = JOURS[js].charAt(0).toUpperCase() + JOURS[js].slice(1);
  return `${nomJour} ${j === 1 ? "1er" : j} ${court && mois.length > 4 ? `${mois.slice(0, mois === "février" ? 4 : mois === "juillet" ? 5 : 3)}.` : mois}`;
}
