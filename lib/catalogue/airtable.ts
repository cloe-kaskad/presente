import "server-only";
import { FORMATS, QUETE, QUETES, type FormatId, type QueteId } from "@/lib/questionnaire/contenu";
import type { Catalogue, Contenu, Intensite, Pratique, Role, Temps } from "./types";

/**
 * Lecture du catalogue dans Airtable : en lecture seule, côté serveur, avec un cache de 10 minutes.
 * On n'écrit jamais dans Airtable. Dans la médiathèque (celle du site public de Liberté, Chérie !),
 * on ne lit que les champs « P! » et ce qu'il faut pour afficher le contenu (titre, autrice, lien, image).
 * Les champs sont désignés par leur identifiant : renommer un champ dans Airtable ne casse rien.
 */

const CACHE_SECONDES = 600;

const MEDIATHEQUE = {
  table: "tblmx8Y2GM25fScZj",
  titre: "fldPq07gvzCqRtmX2",
  auteur: "fldAiDQtwXhOEojam",
  type: "fld1sqA6QNB41YBHa",
  description: "fldxjDLT3kdVaX6iZ",
  image: "fldjJdJl0r1NKwoSc",
  lien: "fldR3tgv52Y5Oomr7",
  quete: "fldhzufEivkUiVzWx",
  capacites: "flddEvJXI7fGh7U8x",
  role: "fldWOF24PJ4HHDPH5",
  intensite: "fldW54fMGBY8HuF8j",
  registre: "fldGpi9nnRtJz2Ug0",
  format: "fldOxyMv9RbEKOPQq",
  temps: "fldIXv3xit5rtWFMu",
  acces: "fldTWVV28gTHpO9JB",
  aEviterSi: "fldhPUJeuSDqSa5da",
  supposeQue: "fldFFdXzckoT1mnuo",
  pourquoi: "fldTPgqqvoOsCZ0ap",
  entreeCourte: "fldHe3HTL54Vhvqxm",
  validation: "fldhF9JcR5AosX8av",
} as const;

const HORS_MEDIATHEQUE = {
  table: "tblVAGua7hcNY49W1",
  titre: "fldPUnZJPYcmqfLZF",
  auteur: "fldXJYkOH95ENR29w",
  type: "flduPkZGNHcK2vT8C",
  lien: "fldYKUI4c7200U6AR",
  quete: "fldj8sjDYa3DOYfOc",
  capacites: "fldikT4y7Wcjb3dls",
  role: "fldUfEwCgd5paspw7",
  intensite: "fldCEBVKUpfFI2zRY",
  registre: "fld4ZjvIDmTLnxFao",
  format: "fld57RcQTQ5yViQI1",
  temps: "fldholh3GwCXpDZH4",
  acces: "fldGqAiMslLE0fV6f",
  aEviterSi: "fldvsKvluyhzLQ3Lf",
  pourquoi: "fldWrugOWdMmHnDum",
  validation: "fldnimdC2eZ3ixICg",
} as const;

const PRATIQUES = {
  table: "tbl9qpu0UKRGO4Q6o",
  nom: "fld6YKsImb79qYItj",
  quete: "fldqVV6XhlJIrepgq",
  capacites: "fldbq6rSnxfiU1aZO",
  role: "flddLS9KZNwb4UbcF",
  formeReponse: "fldJCpf9NUqxVjII9",
  rythme: "fldbSbOgom8J3xzXb",
  intensite: "fldrQO1vmG8FsdPuM",
  adaptation: "fldeMhC3dH9CTRUZl",
  enBref: "fld2w53sYFFXX51BL",
  validation: "fldJfVghs4LFlH55T",
  consigne: "fldcxgQo6OKuUtzNT",
  regles: "fldBAPxef1DrdcnTs",
  pourquoiCaCompte: "fldPKYLXQteRrbURE",
} as const;

type Enregistrement = { id: string; fields: Record<string, unknown> };

async function lireTable(table: string, champs: string[]): Promise<Enregistrement[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) throw new Error("AIRTABLE_TOKEN ou AIRTABLE_BASE_ID manquant");

  const tous: Enregistrement[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${table}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    url.searchParams.set("pageSize", "100");
    for (const c of champs) url.searchParams.append("fields[]", c);
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: CACHE_SECONDES, tags: ["airtable"] },
    });
    if (!r.ok) throw new Error(`Airtable ${table} : ${r.status}`);
    const json = (await r.json()) as { records: Enregistrement[]; offset?: string };
    tous.push(...json.records);
    offset = json.offset;
  } while (offset);
  return tous;
}

// --- Conversion des valeurs ----------------------------------------------------

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const texteOuNull = (v: unknown): string | null => texte(v) || null;
const choix = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name);
  return "";
};
const sans = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function quete(v: unknown): QueteId | null {
  const nom = choix(v);
  return QUETES.find((q) => QUETE[q].nom === nom) ?? null;
}
function codes(v: unknown): string[] {
  return texte(v)
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter((c) => /^[A-Z]{2}\d$/.test(c));
}
function role(v: unknown): Role | null {
  const r = sans(choix(v));
  return r === "ouvrir" || r === "comprendre" || r === "agir" ? r : null;
}
function intensite(v: unknown): Intensite | null {
  const r = sans(choix(v));
  return r === "douce" || r === "franche" || r === "bousculante" ? r : null;
}
function format(v: unknown): FormatId | null {
  const r = sans(choix(v));
  return FORMATS.find((f) => f.id === r)?.id ?? null;
}
function temps(v: unknown): Temps | null {
  const r = sans(choix(v));
  if (r === "court" || r === "moyen" || r === "long") return r;
  return r ? "a_verifier" : null;
}
function image(v: unknown): string | null {
  if (!Array.isArray(v) || !v.length) return null;
  const a = v[0] as { url?: string; thumbnails?: { large?: { url?: string } } };
  return a.thumbnails?.large?.url ?? a.url ?? null;
}
const valide = (v: unknown) => choix(v) === "Validé";

// --- Les trois tables ------------------------------------------------------------

async function lireMediatheque(): Promise<Contenu[]> {
  const { table, ...champs } = MEDIATHEQUE;
  const f = MEDIATHEQUE;
  const lignes = await lireTable(table, Object.values(champs));
  return lignes
    .filter((r) => valide(r.fields[f.validation]))
    .map((r) => ({
      id: r.id,
      source: "mediatheque" as const,
      titre: texte(r.fields[f.titre]),
      auteur: texte(r.fields[f.auteur]),
      type: choix(r.fields[f.type]),
      lien: texteOuNull(r.fields[f.lien]),
      description: texteOuNull(r.fields[f.description]),
      image: image(r.fields[f.image]),
      quete: quete(r.fields[f.quete]),
      capacites: codes(r.fields[f.capacites]),
      role: role(r.fields[f.role]),
      intensite: intensite(r.fields[f.intensite]),
      registre: choix(r.fields[f.registre]) || null,
      format: format(r.fields[f.format]),
      temps: temps(r.fields[f.temps]),
      acces: choix(r.fields[f.acces]) || null,
      aEviterSi: texte(r.fields[f.aEviterSi]),
      supposeQue: texte(r.fields[f.supposeQue]),
      entreeCourte: texteOuNull(r.fields[f.entreeCourte]),
      pourquoi: texteOuNull(r.fields[f.pourquoi]),
    }))
    .filter((c) => c.titre);
}

async function lireHorsMediatheque(): Promise<Contenu[]> {
  const { table, ...champs } = HORS_MEDIATHEQUE;
  const f = HORS_MEDIATHEQUE;
  const lignes = await lireTable(table, Object.values(champs));
  return lignes
    .filter((r) => valide(r.fields[f.validation]))
    .map((r) => ({
      id: r.id,
      source: "hors_mediatheque" as const,
      titre: texte(r.fields[f.titre]),
      auteur: texte(r.fields[f.auteur]),
      type: choix(r.fields[f.type]),
      lien: texteOuNull(r.fields[f.lien]),
      description: null,
      image: null,
      quete: quete(r.fields[f.quete]),
      capacites: codes(r.fields[f.capacites]),
      role: role(r.fields[f.role]),
      intensite: intensite(r.fields[f.intensite]),
      registre: choix(r.fields[f.registre]) || null,
      format: format(r.fields[f.format]),
      temps: temps(r.fields[f.temps]),
      acces: choix(r.fields[f.acces]) || null,
      aEviterSi: texte(r.fields[f.aEviterSi]),
      supposeQue: "",
      entreeCourte: null,
      pourquoi: texteOuNull(r.fields[f.pourquoi]),
    }))
    .filter((c) => c.titre);
}

async function lirePratiques(): Promise<Pratique[]> {
  const { table, ...champs } = PRATIQUES;
  const f = PRATIQUES;
  const lignes = await lireTable(table, Object.values(champs));
  return lignes
    .filter((r) => valide(r.fields[f.validation]))
    .map((r) => {
      const ro = role(r.fields[f.role]);
      return {
        id: r.id,
        nom: texte(r.fields[f.nom]),
        quete: quete(r.fields[f.quete]),
        capacites: codes(r.fields[f.capacites]),
        // Les valeurs du champ Rôle telles qu'elles sont dans Airtable : « Ouvrir » ou « Agir ».
        role: ro === "ouvrir" || ro === "agir" ? ro : null,
        formeReponse: choix(r.fields[f.formeReponse]) || null,
        rythme: texteOuNull(r.fields[f.rythme]),
        intensite: intensite(r.fields[f.intensite]),
        adaptation: choix(r.fields[f.adaptation]) || null,
        enBref: texteOuNull(r.fields[f.enBref]),
        consigne: texteOuNull(r.fields[f.consigne]),
        regles: texteOuNull(r.fields[f.regles]),
        pourquoiCaCompte: texteOuNull(r.fields[f.pourquoiCaCompte]),
      };
    })
    .filter((x) => x.nom);
}

/** Le catalogue validé. En cas d'erreur, un catalogue vide : la page s'affiche quand même. */
export async function chargerCatalogue(): Promise<{ catalogue: Catalogue; erreur: boolean }> {
  try {
    const [m, h, p] = await Promise.all([lireMediatheque(), lireHorsMediatheque(), lirePratiques()]);
    return { catalogue: { contenus: [...h, ...m], pratiques: p }, erreur: false };
  } catch (e) {
    console.error("[airtable] lecture impossible :", e instanceof Error ? e.message : "inconnue");
    return { catalogue: { contenus: [], pratiques: [] }, erreur: true };
  }
}
