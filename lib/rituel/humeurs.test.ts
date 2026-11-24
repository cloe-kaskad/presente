import { describe, expect, it } from "vitest";
import { COULEUR, HUMEURS, LEGENDE, estHumeur, troisJoursLourds } from "./humeurs";

describe("trois jours lourds", () => {
  it("trois jours de suite parmi triste, lourde, anxieuse", () => {
    const j = [
      { jour: "2026-11-17", humeur: "triste" },
      { jour: "2026-11-18", humeur: "anxieuse" },
      { jour: "2026-11-19", humeur: "lourde" },
    ];
    expect(troisJoursLourds(j, "2026-11-19")).toBe(true);
    expect(troisJoursLourds(j, "2026-11-20")).toBe(true); // pas encore noté aujourd'hui
    expect(troisJoursLourds(j, "2026-11-22")).toBe(false);
  });
  it("un jour léger ou un trou casse la série", () => {
    expect(
      troisJoursLourds(
        [
          { jour: "2026-11-17", humeur: "triste" },
          { jour: "2026-11-18", humeur: "calme" },
          { jour: "2026-11-19", humeur: "lourde" },
        ],
        "2026-11-19",
      ),
    ).toBe(false);
    expect(troisJoursLourds([{ jour: "2026-11-17", humeur: "triste" }, { jour: "2026-11-19", humeur: "lourde" }], "2026-11-19")).toBe(false);
  });
});

describe("« fatiguée » (V0.12)", () => {
  it("est dans la liste, entre « énervée » et « grise »", () => {
    expect(HUMEURS.indexOf("fatiguée")).toBe(HUMEURS.indexOf("énervée") + 1);
    expect(HUMEURS.indexOf("grise")).toBe(HUMEURS.indexOf("fatiguée") + 1);
    expect(HUMEURS).toHaveLength(10);
  });
  it("prend la couleur de « grise », et la légende dit « grise, fatiguée »", () => {
    expect(COULEUR["fatiguée"].fond).toBe(COULEUR.grise.fond);
    expect(LEGENDE.map((l) => l.label)).toContain("grise, fatiguée");
  });
  it("ne compte pas parmi les jours lourds", () => {
    const jours = ["2026-11-24", "2026-11-23", "2026-11-22"].map((jour) => ({ jour, humeur: "fatiguée" }));
    expect(troisJoursLourds(jours, "2026-11-24")).toBe(false);
    expect(estHumeur("fatiguée")).toBe(true);
  });
});
