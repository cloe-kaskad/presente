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
