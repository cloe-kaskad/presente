import { describe, expect, it } from "vitest";
import { choisirBuddy, peuventEtreAssociees } from "./association";
import { etatBuddy, numeroDeQuestion } from "./etat";

describe("la proposition", () => {
  it("arrive à la semaine 3, revient une fois au mois 2, puis plus jamais", () => {
    expect(etatBuddy({}, 2)).toBe("rien");
    expect(etatBuddy({}, 3)).toBe("proposee");
    expect(etatBuddy({ buddy_refus: 1, buddy_refus_semaine: 3 }, 4)).toBe("rien");
    expect(etatBuddy({ buddy_refus: 1, buddy_refus_semaine: 3 }, 5)).toBe("proposee");
    expect(etatBuddy({ buddy_refus: 2, buddy_refus_semaine: 5 }, 9)).toBe("rien");
  });
  it("acceptée, arrêtée, ou proposée par l'équipe en test", () => {
    expect(etatBuddy({ buddy: 1 }, 3)).toBe("acceptee");
    expect(etatBuddy({ buddy: 2 }, 3)).toBe("arretee");
    expect(etatBuddy({ buddy_test: 1 }, 1)).toBe("proposee");
  });
  it("une question par semaine depuis l'accord", () => {
    expect(numeroDeQuestion(1000, 1000)).toBe(1);
    expect(numeroDeQuestion(1000, 1000 + 8 * 86400)).toBe(2);
    expect(numeroDeQuestion(1000, 1000 + 99 * 86400)).toBe(4);
  });
});

describe("les règles d'association (vraie version)", () => {
  const f = (id: string, semaine: number, quete = "voix", accord = true) => ({ id, semaine, quete, accord, dejaAssociee: false });
  it("accord des deux, pas avant la semaine 3, même mois, une semaine d'écart au plus", () => {
    expect(peuventEtreAssociees(f("a", 3), f("b", 4))).toBe(true);
    expect(peuventEtreAssociees(f("a", 3), f("b", 4, "voix", false))).toBe(false);
    expect(peuventEtreAssociees(f("a", 2), f("b", 3))).toBe(false);
    expect(peuventEtreAssociees(f("a", 4), f("b", 5))).toBe(false);
  });
  it("préfère la même quête ; sinon elle attend", () => {
    expect(choisirBuddy(f("a", 3, "voix"), [f("b", 3, "argent"), f("c", 4, "voix")])?.id).toBe("c");
    expect(choisirBuddy(f("a", 3), [f("b", 7)])).toBeNull();
  });
});

import { ceQue, de, prochaineQuestionLe } from "./etat";

describe("la suite et l'élision", () => {
  it("la prochaine question arrive 7 jours après le début de la question en cours, avance de test comprise", () => {
    expect(prochaineQuestionLe({ buddy_le: 1000 }, 1)).toBe(1000 + 7 * 86400);
    expect(prochaineQuestionLe({ buddy_le: 1000, buddy_avance: 1 }, 2)).toBe(1000 + 7 * 86400);
  });
  it("élide devant une voyelle", () => {
    expect(ceQue("Inès")).toBe("Ce qu'Inès");
    expect(ceQue("Marie")).toBe("Ce que Marie");
    expect(de("Élodie")).toBe("d'Élodie");
  });
});

describe("la recherche (V0.11)", () => {
  const lundi = Date.parse("2026-11-23T10:00:00Z") / 1000;
  it("on cherche, puis on la trouve le lendemain, ou tout de suite en test", () => {
    expect(etatBuddy({ buddy: 3, buddy_recherche_le: lundi }, 3, lundi + 3600)).toBe("recherche");
    expect(etatBuddy({ buddy: 3, buddy_recherche_le: lundi }, 3, lundi + 86400)).toBe("trouvee");
    expect(etatBuddy({ buddy: 3, buddy_recherche_le: lundi, buddy_trouvee: 1 }, 3, lundi)).toBe("trouvee");
  });
});

import { finDuCheminADeux, numeroAccessible, pointDuMois } from "./etat";
import { phraseRetenueParInes } from "./profil-test";
import { phrasesDe } from "./questions";

describe("l'échange sur tout le chemin (V0.11)", () => {
  const semaines = (k: number) => 1000 + k * 7 * 86400;
  it("douze questions, mais on ne passe au mois suivant qu'après « Oui, on continue »", () => {
    expect(numeroAccessible({ buddy_le: 1000 }, semaines(6))).toBe(4);
    expect(numeroAccessible({ buddy_le: 1000, buddy_suite_m1: 1 }, semaines(6))).toBe(7);
    expect(numeroAccessible({ buddy_le: 1000, buddy_suite_m1: 1, buddy_suite_m2: 1 }, semaines(20))).toBe(12);
  });
  it("le point de fin de mois, après la quatrième question", () => {
    expect(pointDuMois({}, 4, true)).toBe(1);
    expect(pointDuMois({}, 4, false)).toBeNull();
    expect(pointDuMois({ buddy_suite_m1: 1 }, 4, true)).toBeNull();
    expect(pointDuMois({ buddy_suite_m1: 1 }, 8, true)).toBe(2);
  });
  it("la fin du chemin à deux", () => {
    expect(finDuCheminADeux({}, false)).toBe(false);
    expect(finDuCheminADeux({}, true)).toBe(true);
    expect(finDuCheminADeux({ buddy_fin_test: 1 }, false)).toBe(true);
  });
  it("les phrases à choisir, et celle qu'Inès retient", () => {
    expect(phrasesDe("J'ai osé. Enfin ! Pas tout.")).toEqual(["J'ai osé.", "Enfin !", "Pas tout."]);
    expect(phraseRetenueParInes(["Un. J'ai demandé la date d'un entretien."])).toBe("J'ai demandé la date d'un entretien.");
  });
});
