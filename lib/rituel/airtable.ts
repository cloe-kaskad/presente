import "server-only";
import { apercuDuLien } from "@/lib/catalogue/apercu";
import { lireTable } from "@/lib/catalogue/airtable";
import { plusJours } from "./citations";

/**
 * La Question Chérie et l'article du jour, lus dans Airtable en lecture seule (cache 10 minutes).
 * Sans ligne validée, on ne montre rien.
 */

const QC = {
  table: "tbl1Cs9vXd8kV9D5u",
  question: "fldRRx8QdjtridCdq",
  date: "fldMHht3JNLJR3zX8",
  lien: "fldgZVmuUgdQgLWw1",
  accroche: "fldUYmk4oOXeDy5JQ",
  statut: "fldVlsCSmDEczGRRT",
};

const ARTICLE = {
  table: "tblnNOClHG4522gic",
  titre: "fldqPNubIwpx7BcJR",
  date: "fldnBaooiFhkMJJYb",
  statut: "fldnqIQq1LSSvxEBa",
  lien: "fldTFnyWOoP20vORm",
  source: "fldcerynNul7C3LoS",
  regard: "fldheFTahAgYeH9Uo",
};

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const choix = (v: unknown) => (v && typeof v === "object" && "name" in v ? String((v as { name: unknown }).name) : texte(v));
const valide = (v: unknown) => choix(v) === "Validé";

export type QuestionCherie = { id: string; question: string; date: string; lien: string | null; accroche: string | null };
export type Article = { titre: string; lien: string; source: string; regard: string | null; image: string | null };

/** La ligne « Validé » la plus récente. */
export async function questionCherie(): Promise<QuestionCherie | null> {
  try {
    const { table, ...champs } = QC;
    const lignes = await lireTable(table, Object.values(champs));
    const q = lignes
      .filter((r) => valide(r.fields[QC.statut]) && texte(r.fields[QC.question]))
      .map((r) => ({
        id: r.id,
        question: texte(r.fields[QC.question]),
        date: texte(r.fields[QC.date]),
        lien: texte(r.fields[QC.lien]) || null,
        accroche: texte(r.fields[QC.accroche]) || null,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return q[0] ?? null;
  } catch (e) {
    console.error("[question chérie] lecture impossible :", e instanceof Error ? e.message : "inconnue");
    return null;
  }
}

/** L'article validé du jour ; sinon le plus récent des trois derniers jours ; sinon rien. */
export async function articleDuJour(aujourdhui: string): Promise<Article | null> {
  try {
    const { table, ...champs } = ARTICLE;
    const lignes = await lireTable(table, Object.values(champs));
    const debut = plusJours(aujourdhui, -3);
    const a = lignes
      .filter((r) => valide(r.fields[ARTICLE.statut]))
      .map((r) => ({
        titre: texte(r.fields[ARTICLE.titre]),
        date: texte(r.fields[ARTICLE.date]).slice(0, 10),
        lien: texte(r.fields[ARTICLE.lien]),
        source: texte(r.fields[ARTICLE.source]),
        regard: texte(r.fields[ARTICLE.regard]) || null,
      }))
      .filter((x) => x.titre && x.lien && x.date && x.date <= aujourdhui && x.date >= debut)
      .sort((x, y) => (x.date < y.date ? 1 : -1))[0];
    if (!a) return null;
    const apercu = await apercuDuLien(a.lien);
    return { titre: a.titre, lien: a.lien, source: a.source, regard: a.regard, image: apercu.image };
  } catch (e) {
    console.error("[article du jour] lecture impossible :", e instanceof Error ? e.message : "inconnue");
    return null;
  }
}
