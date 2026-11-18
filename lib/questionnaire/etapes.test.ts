import { describe, expect, it } from "vitest";
import { indexDeReprise, listeEtapes, partieDe } from "./etapes";

describe("les écrans du questionnaire", () => {
  const e = listeEtapes(["argent", "voix", "liens"]);

  it("vont de l'ouverture à la fin, avec un zoom par quête qui ressort", () => {
    expect(e[0]).toBe("intro");
    expect(e.at(-1)).toBe("fin");
    expect(e.filter((x) => x.startsWith("p3:"))).toEqual(["p3:argent", "p3:voix", "p3:liens"]);
    expect(partieDe("p4:filrouge")).toBe(4);
  });

  it("reprend là où elle s'était arrêtée", () => {
    expect(indexDeReprise(e, "p2:corps")).toBe(e.indexOf("p2:corps"));
    expect(indexDeReprise(e, null)).toBe(0);
  });

  it("si la quête du zoom a changé, reprend au premier zoom", () => {
    expect(indexDeReprise(e, "p3:creation")).toBe(e.indexOf("p3:argent"));
  });
});
