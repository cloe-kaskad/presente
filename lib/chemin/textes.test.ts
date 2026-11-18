import { describe, expect, it } from "vitest";
import { pourquoiSecours, prenomAffiche, semainesDuMois, toucheUnSujetAEviter } from "./textes";

describe("les textes de secours de la carte", () => {
  it("cite ses mots exacts, sans les modifier", () => {
    const r = pourquoiSecours(0, "  j'ai honte de ne rien comprendre à mes comptes ");
    expect(r.citation).toBe("j'ai honte de ne rien comprendre à mes comptes");
  });

  it("ne cite rien qui touche un sujet à éviter", () => {
    expect(toucheUnSujetAEviter("depuis la maladie de ma mère", "la maladie, un deuil")).toBe(true);
    expect(pourquoiSecours(1, "depuis la maladie de ma mère", "la maladie").citation).toBeNull();
  });

  it("ne cite pas un texte trop long, ni un texte vide", () => {
    expect(pourquoiSecours(2, "a".repeat(200)).citation).toBeNull();
    expect(pourquoiSecours(2, "  ").citation).toBeNull();
  });
});

describe("les semaines", () => {
  it("suivent le rythme : contenu, monde, agir, monde et palier", () => {
    const s = semainesDuMois(1, ["Savoir dire non", "Oser demander"], "philosophie_pratique");
    expect(s.map((x) => x.numero)).toEqual([5, 6, 7, 8]);
    expect(s[0].titre).toBe("Savoir dire non");
    expect(s[1].titre).toBe("Qu'est-ce qu'une vie choisie ?");
    expect(s[3].etiquette).toContain("palier");
  });
});

describe("le prénom", () => {
  it("prend toujours une majuscule", () => {
    expect(prenomAffiche("cloe")).toBe("Cloe");
    expect(prenomAffiche("  marie-claire ")).toBe("Marie-Claire");
    expect(prenomAffiche("ÉLODIE")).toBe("Élodie");
    expect(prenomAffiche("anne sophie")).toBe("Anne Sophie");
    expect(prenomAffiche("")).toBeNull();
  });
});
