import { describe, expect, it } from "vitest";
import { pageGenerale, pourClaude, texteCourt, type RetourLu } from "./types";

describe("« Un retour ? »", () => {
  it("garde la page générale, sans paramètres ni ancre", () => {
    expect(pageGenerale("https://presente.fr/semaine/3/fil?x=1#haut")).toBe("/semaine/3/fil");
    expect(pageGenerale("/chemin")).toBe("/chemin");
  });
  it("coupe le texte pointé à 120 caractères, sur une ligne", () => {
    expect(texteCourt("  Noter\n ma   journée ")).toBe("Noter ma journée");
    expect(texteCourt("a".repeat(200))).toHaveLength(120);
    expect(texteCourt("")).toBeNull();
  });
  it("« Copier pour Claude » : seulement les retours à traiter, en texte simple", () => {
    const r = (id: number, traite: boolean): RetourLu => ({
      id, prenom: "Stéphanie", created_at: "2026-11-28T10:00:00Z", page_url: "/chemin", page_titre: "Mon espace", element_texte: "Noter ma journée",
      toute_la_page: false, appareil: "telephone", ecran_largeur: 390, semaine: 2, etape: "étape 1", types: ["marche_pas"], texte: `Texte ${id}`, traite, note: null,
    });
    const t = pourClaude([r(1, false), r(2, true)], () => "samedi");
    expect(t).toContain("(1)");
    expect(t).toContain("« Texte 1 »");
    expect(t).not.toContain("Texte 2");
    expect(t).toContain("Ça ne marche pas");
    expect(pourClaude([r(2, true)], () => "")).toBe("Aucun retour à traiter.");
  });
});
