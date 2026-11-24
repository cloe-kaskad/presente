import { describe, expect, it } from "vitest";
import { MOTS_MAX, TROP_DE_MOTS, ajouterMot, nettoyerMots, normaliserMot, retirerMot } from "./mots";

describe("« + un mot » (V0.12)", () => {
  it("nettoie le mot : espaces en trop, minuscules", () => {
    expect(normaliserMot("  En   VRAC ")).toBe("en vrac");
  });
  it("enregistre un mot à soi, et le choisit", () => {
    const r = ajouterMot([], "Soulagée");
    expect(r).toEqual({ ok: true, mot: "soulagée", mots: ["soulagée"], nouveau: true });
  });
  it("un doublon (dans les dix mots ou dans les siens) est simplement choisi, sans doublon", () => {
    expect(ajouterMot(["soulagée"], "SOULAGÉE ")).toEqual({ ok: true, mot: "soulagée", mots: ["soulagée"], nouveau: false });
    expect(ajouterMot(["soulagée"], "Calme")).toEqual({ ok: true, mot: "calme", mots: ["soulagée"], nouveau: false });
  });
  it("refuse le neuvième mot", () => {
    const huit = Array.from({ length: MOTS_MAX }, (_, i) => `mot ${i}`);
    expect(ajouterMot(huit, "neuvième")).toEqual({ ok: false, erreur: TROP_DE_MOTS, mots: huit });
  });
  it("refuse un mot vide ou trop long", () => {
    expect(ajouterMot([], "   ").ok).toBe(false);
    expect(ajouterMot([], "a".repeat(25)).ok).toBe(false);
    expect(ajouterMot([], "a".repeat(24)).ok).toBe(true);
  });
  it("retire un mot de la liste", () => {
    expect(retirerMot(["soulagée", "en vrac"], "Soulagée")).toEqual(["en vrac"]);
  });
  it("nettoie une liste abîmée", () => {
    expect(nettoyerMots(["Soulagée", "soulagée", "calme", 3, "", null])).toEqual(["soulagée"]);
    expect(nettoyerMots(null)).toEqual([]);
  });
});
