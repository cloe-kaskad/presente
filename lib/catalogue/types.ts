import type { FormatId, QueteId } from "@/lib/questionnaire/contenu";

export type Temps = "court" | "moyen" | "long" | "a_verifier" | "trop_court";
export type Role = "ouvrir" | "comprendre" | "agir";
export type Intensite = "douce" | "franche" | "bousculante";

/** Un contenu validé : médiathèque LC (champs P!) ou contenus hors médiathèque. */
export type Contenu = {
  id: string;
  source: "mediatheque" | "hors_mediatheque";
  titre: string;
  auteur: string;
  type: string; // Podcast, Livre…
  lien: string | null;
  description: string | null;
  image: string | null;
  quete: QueteId | null;
  capacites: string[]; // codes, ex. ["AR3", "AR6"]
  role: Role | null;
  intensite: Intensite | null;
  registre: string | null;
  format: FormatId | null;
  temps: Temps | null;
  acces: string | null;
  aEviterSi: string; // texte libre, peut être vide
  supposeQue: string; // texte libre, vide = toutes
  entreeCourte: string | null;
  pourquoi: string | null;
};

/** Une pratique validée de la table P! Pratiques. */
export type Pratique = {
  id: string;
  nom: string;
  quete: QueteId | null;
  capacites: string[];
  role: "ouvrir" | "agir" | null;
  formeReponse: string | null;
  rythme: string | null;
  intensite: Intensite | null;
  adaptation: string | null;
  enBref: string | null;
  consigne: string | null;
  regles: string | null;
  pourquoiCaCompte: string | null;
  /** Le guidage audio (nom du fichier dans public/audio/), ou null : voir lib/catalogue/guides.ts. */
  audio?: string | null;
};

export type Catalogue = { contenus: Contenu[]; pratiques: Pratique[] };
