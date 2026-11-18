import { describe, expect, it } from "vitest";
import { capacitesParMots, departageParMots } from "./lecture-mots";

describe("lecture par mots-clés (repli sans Claude)", () => {
  it("trouve la quête nommée parmi les candidates", () => {
    expect(departageParMots("La Création, je ne peins plus", ["liens", "creation"])).toBe("creation");
    expect(departageParMots("mes amitiés me manquent", ["liens", "creation"])).toBe("liens");
  });

  it("ne tranche pas si rien ou plusieurs ressortent", () => {
    expect(departageParMots("je ne sais pas", ["liens", "creation"])).toBeNull();
    expect(departageParMots("créer avec mes amies", ["liens", "creation"])).toBeNull();
  });

  it("propose les capacités dont la phrase partage ses mots", () => {
    expect(capacitesParMots("je culpabilise à chaque dépense pour moi", "argent", [], 1)).toEqual(["AR7"]);
    expect(capacitesParMots("rien à voir", "argent", [], 2)).toEqual([]);
  });
});
