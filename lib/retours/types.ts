/** « Un retour ? » (brief V0.13, point 4) : les retours des testeuses, pointés sur la page. */
export const TYPES_RETOUR = [
  { id: "comprends_pas", label: "Je ne comprends pas" },
  { id: "marche_pas", label: "Ça ne marche pas" },
  { id: "aime", label: "J'aime" },
  { id: "idee", label: "Une idée" },
] as const;
export type TypeRetour = (typeof TYPES_RETOUR)[number]["id"];
export const IMAGE_MAX = 5 * 1024 * 1024;
export const UN_DE_SES_TEXTES = "un de ses textes";

/** Ce que le navigateur envoie avec le texte (jamais de capture d'écran). */
export type Repere = {
  pageUrl: string;
  pageTitre: string;
  xPct: number | null;
  yPct: number | null;
  elementTexte: string | null;
  touteLaPage: boolean;
  ecranLargeur: number;
  ecranHauteur: number;
};

/** L'adresse de la page, sans ce qui pourrait identifier quelqu'un (paramètres, ancres). */
export function pageGenerale(url: string): string {
  try {
    const u = new URL(url, "https://exemple.invalid");
    return u.pathname.slice(0, 300) || "/";
  } catch {
    return "/";
  }
}

/** Le texte visible d'un élément, une ligne, 120 caractères au plus. */
export function texteCourt(t: string | null | undefined): string | null {
  const s = (t ?? "").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, 120) : null;
}

export type RetourLu = {
  id: number;
  prenom: string | null;
  created_at: string;
  page_url: string;
  page_titre: string | null;
  element_texte: string | null;
  toute_la_page: boolean;
  appareil: string | null;
  ecran_largeur: number | null;
  semaine: number | null;
  etape: string | null;
  types: string[];
  texte: string;
  traite: boolean;
  note: string | null;
};

const LIBELLE = Object.fromEntries(TYPES_RETOUR.map((t) => [t.id, t.label])) as Record<string, string>;
export const libelleType = (id: string) => LIBELLE[id] ?? id;

/** « Copier pour Claude » : les retours à traiter, en texte simple, à coller dans la conversation. */
export function pourClaude(retours: RetourLu[], quand: (iso: string) => string): string {
  const a = retours.filter((r) => !r.traite);
  if (!a.length) return "Aucun retour à traiter.";
  return [
    `Retours des testeuses à traiter (${a.length}) :`,
    ...a.map((r, i) => {
      const ou = r.toute_la_page ? "sur toute la page" : r.element_texte ? `sur « ${r.element_texte} »` : "sur un endroit de la page";
      const quoi = r.types.length ? ` [${r.types.map(libelleType).join(", ")}]` : "";
      const ctx = [r.appareil, r.ecran_largeur ? `${r.ecran_largeur} px` : null, r.semaine ? `semaine ${r.semaine}` : null, r.etape].filter(Boolean).join(", ");
      return (
        `\n${i + 1}. ${r.page_url}${r.page_titre ? ` (${r.page_titre})` : ""}, ${ou}${quoi}\n` +
        `   ${r.prenom ?? "Une testeuse"}, ${quand(r.created_at)}${ctx ? ` (${ctx})` : ""}\n` +
        `   « ${r.texte.replace(/\s+/g, " ").trim()} »` +
        (r.note ? `\n   Note de l'équipe : ${r.note}` : "")
      );
    }),
  ].join("\n");
}
