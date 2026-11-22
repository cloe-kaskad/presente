import { describe, expect, it } from "vitest";
import { etapesFaitesDuMois, pointsDeLaSemaine } from "./etapes";

describe("les étapes du mois", () => {
  it("compte deux points par semaine faite (toutes ses étapes)", () => {
    expect(etapesFaitesDuMois(0, { "1": 4, "2": 3 })).toBe(4);
  });
  it("compte un point quand le contenu et le carnet sont faits", () => {
    expect(pointsDeLaSemaine(1, 3, false)).toBe(1);
    expect(pointsDeLaSemaine(1, 2, false)).toBe(0);
    expect(etapesFaitesDuMois(0, { "1": 4, "2": 3, "3": 3 })).toBe(5);
  });
  it("au mois 2, ne compte que les semaines 5 à 8", () => {
    expect(etapesFaitesDuMois(1, { "1": 4, "5": 4 })).toBe(2);
    expect(etapesFaitesDuMois(1, { "1": 4 })).toBe(0);
  });
});
