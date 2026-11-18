/** Dire un contenu en quelques mots : « Un podcast court », « Un livre, par le chapitre 3 ». */
import type { Contenu } from "./types";

const ARTICLES: Record<string, string> = {
  podcast: "Un podcast",
  livre: "Un livre",
  roman: "Un roman",
  documentaire: "Un documentaire",
  film: "Un film",
  bd: "Une BD",
  theatre: "Une pièce de théâtre",
  video: "Une vidéo",
  texte: "Un texte",
};

const DUREES: Record<string, string> = {
  court: "court",
  moyen: "d'une demi-heure environ",
};

function sansAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function decrireContenu(c: Pick<Contenu, "type" | "temps" | "entreeCourte">): string {
  const nom = ARTICLES[sansAccents(c.type)] ?? "Un contenu";
  if (c.entreeCourte) return `${nom}, en commençant par ${c.entreeCourte.charAt(0).toLowerCase()}${c.entreeCourte.slice(1)}`;
  const duree = c.temps ? DUREES[c.temps] : undefined;
  if (!duree) return nom;
  // « Une vidéo courte », « Un podcast court »
  const feminin = nom.startsWith("Une ");
  return `${nom} ${duree === "court" && feminin ? "courte" : duree}`;
}
