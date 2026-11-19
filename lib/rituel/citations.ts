/**
 * Les citations du jour et des écrans de mantra.
 * Uniquement des phrases de femmes, avec leur nom et la source. Cloé valide chaque citation :
 * ne pas en ajouter sans elle.
 */
export type Citation = { texte: string; autrice: string; source: string };

/** Des phrases de femmes, toutes du domaine public. Traductions maison. */
export const CITATIONS: Citation[] = [
  { texte: "J’habite le possible.", autrice: "Emily Dickinson", source: "poème, vers 1862" },
  { texte: "Il n’y a ni grille, ni serrure, ni verrou que vous puissiez poser sur la liberté de mon esprit.", autrice: "Virginia Woolf", source: "Une chambre à soi, 1929" },
  { texte: "Femme, réveille-toi.", autrice: "Olympe de Gouges", source: "Déclaration des droits de la femme et de la citoyenne, 1791" },
  { texte: "Je ne suis pas un oiseau, et aucun filet ne me retient.", autrice: "Charlotte Brontë", source: "Jane Eyre, 1847" },
  { texte: "Je n’ai pas peur des tempêtes : j’apprends à mener mon bateau.", autrice: "Louisa May Alcott", source: "Les Quatre Filles du docteur March, 1869" },
  { texte: "Je ne souhaite pas qu’elles aient du pouvoir sur les hommes, mais sur elles-mêmes.", autrice: "Mary Wollstonecraft", source: "Défense des droits de la femme, 1792" },
  { texte: "Mon courage grandit chaque fois qu’on essaie de m’intimider.", autrice: "Jane Austen", source: "Orgueil et Préjugés, 1813" },
];

/** Le jour, à Paris, au format AAAA-MM-JJ. */
export function jourAParis(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Nombre de jours depuis le 1er janvier 1970, pour le jour donné (AAAA-MM-JJ). */
export function numeroDuJour(jour: string): number {
  return Math.floor(Date.UTC(+jour.slice(0, 4), +jour.slice(5, 7) - 1, +jour.slice(8, 10)) / 86_400_000);
}

/** La même pour toutes, une par jour, choisie par la date. */
export function citationDuJour(jour: string = jourAParis()): Citation {
  return CITATIONS[numeroDuJour(jour) % CITATIONS.length];
}

/** « Jeudi 19 novembre » */
export function dateEnLettres(jour: string = jourAParis(), avecAnnee = false): string {
  const d = new Date(`${jour}T12:00:00Z`);
  const t = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(avecAnnee ? { year: "numeric" } : {}),
  }).format(d);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Le lundi de la semaine du jour donné (AAAA-MM-JJ). */
export function lundiDe(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  const decalage = (d.getUTCDay() + 6) % 7; // lundi = 0
  return new Date(d.getTime() - decalage * 86_400_000).toISOString().slice(0, 10);
}

/** Ajoute n jours à un jour (AAAA-MM-JJ). */
export function plusJours(jour: string, n: number): string {
  return new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
