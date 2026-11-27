import "server-only";
import { QUETE, type QueteId } from "@/lib/questionnaire/contenu";
import { lireTable } from "./airtable";
import MAISON from "./fil-maison.json";

/**
 * « Tirer le fil » (brief V0.9) : une lecture maison de cinq minutes par semaine de quête, écrite et validée
 * par l'équipe dans la table Airtable « P! Tirer le fil ». Lecture seule, cache de 10 minutes comme les autres
 * tables. Jamais générée par l'IA. Le champ « Notes pour Cloé » n'est jamais lu.
 */
const TIRER_LE_FIL = {
  table: "tblWqP9B2vSgOCQ6q",
  titre: "fldYO7gBPv2CRpnvL",
  quete: "fldutMohptLseWc16",
  semaine: "fldjX2nzN0c8aoBSi",
  capacite: "fldPllU7v41V4infS",
  statut: "fldND05M8avF6yDp1",
  chapo: "fldcXvHvA0P1UrMKF",
  idee: { titre: "fldISknFzL6AG8rMn", texte: "fldm8XFxQnpBNBtH8", source: "fld0BxpfeXVfyGf3z", lien: "fldWv5zYdhyPhaEjM" },
  chiffre: { titre: "fldApmmP0J2lrMNs7", texte: "fldIFfZZYCmlHTqnO", source: "fldCElUSJaqdZPq7X", lien: "fld0DWFD3lGI65WOy" },
  regard: { titre: "fld61P9MjnaV58w6I", texte: "fldqEYeQ9RLVS7lA6", source: "fldFhoRliYZj650XW", lien: "fldHyXr4s48BykDgA" },
  echo: { titre: "fldH1AzLkjwgtPTeM", texte: "fld3YnNAMURGRM5Qe", source: "fld01pF5ubF94kczB", lien: "fldACmySDhiWJco2w" },
} as const;

export type BlocDuFil = { cle: "idee" | "chiffre" | "regard" | "echo"; etiquette: string; titre: string; texte: string; source: string; lien: string | null };
export type Fil = { titre: string; chapo: string; blocs: BlocDuFil[] };

const ETIQUETTES = { idee: "Une idée", chiffre: "Un chiffre", regard: "Un regard", echo: "Un écho" } as const;

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const choix = (v: unknown) => (v && typeof v === "object" && "name" in v ? String((v as { name: unknown }).name) : texte(v));
const lienSur = (v: unknown) => {
  const t = texte(v);
  return /^https?:\/\//i.test(t) ? t : null;
};

/**
 * Quelle lecture montrer : celle validée pour la capacité travaillée cette semaine (le focus du contenu et de
 * l'exercice). Sinon, une lecture générale de la quête et de la semaine (sans capacité). Sinon rien : l'étape n'existe pas.
 */
export function choisirLecture<T extends { statut: string; quete: string; semaine: string; capacite: string }>(
  lignes: T[],
  quete: string,
  semaine: 1 | 3,
  capacite: string | null,
): T | null {
  const validees = lignes.filter((l) => l.statut === "Validé" && l.quete === quete);
  const juste = capacite ? validees.find((l) => l.capacite.toUpperCase() === capacite.toUpperCase()) : undefined;
  return juste ?? validees.find((l) => !l.capacite && l.semaine === String(semaine)) ?? null;
}

type BlocMaison = { titre: string; texte: string; source: string; lien?: string };
type LectureMaison = { capacite: string; quete: string; titre: string; chapo: string; idee: BlocMaison; chiffre: BlocMaison; regard: BlocMaison; echo: BlocMaison };

/**
 * Les 49 lectures écrites le 27 novembre 2026 (une par capacité), rangées dans le site, affichées à la demande de Cloé.
 * Une lecture validée dans Airtable pour la même capacité passe toujours devant.
 */
export function lectureMaison(capacite: string | null): Fil | null {
  if (!capacite) return null;
  const l = (MAISON as LectureMaison[]).find((x) => x.capacite.toUpperCase() === capacite.toUpperCase());
  if (!l) return null;
  const blocs = (["idee", "chiffre", "regard", "echo"] as const)
    .map((cle) => ({ cle, etiquette: ETIQUETTES[cle], titre: l[cle].titre.trim(), texte: l[cle].texte.trim(), source: l[cle].source.trim(), lien: lienSur(l[cle].lien) }))
    .filter((b) => b.titre || b.texte);
  return { titre: l.titre, chapo: l.chapo, blocs };
}

/**
 * La lecture de la capacité de la semaine : d'abord Airtable (validée), puis les lectures du site, puis la lecture
 * générale de la quête et de la semaine dans Airtable. Sinon null. Airtable injoignable : les lectures du site.
 */
export async function tirerLeFil(quete: QueteId, semaine: 1 | 3, capacite: string | null = null): Promise<Fil | null> {
  const f = TIRER_LE_FIL;
  const champs = [f.titre, f.quete, f.semaine, f.capacite, f.statut, f.chapo, ...(["idee", "chiffre", "regard", "echo"] as const).flatMap((b) => Object.values(f[b]))];
  try {
    const lignes = (await lireTable(f.table, champs)).map((l) => ({
      ligne: l,
      statut: choix(l.fields[f.statut]),
      quete: choix(l.fields[f.quete]),
      semaine: choix(l.fields[f.semaine]),
      capacite: texte(l.fields[f.capacite]),
    }));
    const deLaCapacite = capacite ? choisirLecture(lignes.filter((l) => l.capacite), QUETE[quete].nom, semaine, capacite) : null;
    const lecture = deLaCapacite ?? (lectureMaison(capacite) ? null : choisirLecture(lignes, QUETE[quete].nom, semaine, capacite));
    if (!lecture) return lectureMaison(capacite);
    const r = lecture.ligne;
    const blocs = (["idee", "chiffre", "regard", "echo"] as const)
      .map((cle) => ({
        cle,
        etiquette: ETIQUETTES[cle],
        titre: texte(r.fields[f[cle].titre]),
        texte: texte(r.fields[f[cle].texte]),
        source: texte(r.fields[f[cle].source]),
        lien: lienSur(r.fields[f[cle].lien]),
      }))
      .filter((b) => b.titre || b.texte); // un bloc vide ne s'affiche pas
    const titre = texte(r.fields[f.titre]);
    if (!titre && !blocs.length) return lectureMaison(capacite);
    return { titre, chapo: texte(r.fields[f.chapo]), blocs };
  } catch (e) {
    console.error("[tirer le fil] lecture impossible :", e instanceof Error ? e.message : "inconnue");
    return lectureMaison(capacite);
  }
}
