import { describe, expect, it } from "vitest";
import { etatExercice, joursDuRythme, jourEnCours } from "./exercice";

describe("joursDuRythme", () => {
  it("lit les rythmes sur plusieurs jours", () => {
    expect(joursDuRythme("Une semaine")).toBe(7);
    expect(joursDuRythme("Une semaine, au fil de l'eau")).toBe(7);
    expect(joursDuRythme("Deux semaines, quotidien")).toBe(14);
    expect(joursDuRythme("Trois semaines, au fil de l'eau")).toBe(21);
    expect(joursDuRythme("Dix jours, une phrase par soir")).toBe(10);
    expect(joursDuRythme("Chaque soir, 2 min")).toBe(7);
  });
  it("garde les exercices en une fois", () => {
    expect(joursDuRythme("30 min, écrit")).toBeNull();
    expect(joursDuRythme("Une fois")).toBeNull();
    expect(joursDuRythme("Trois jours d'observation, puis une fois")).toBeNull();
    expect(joursDuRythme(null)).toBeNull();
  });
});

describe("etatExercice", () => {
  const base = { n: 1, semaineCourante: 1, entrees: [] as { code: string; reponse: string }[] };
  it("n'existe pas avant « Vers ton exercice »", () => {
    expect(etatExercice({ ...base, progression: { "1": 2 } })).toBeNull();
  });
  it("pas commencé, en cours, terminé", () => {
    expect(etatExercice({ ...base, progression: { "1": 3 } })).toBe("pas_commence");
    expect(etatExercice({ ...base, progression: { "1": 3, ex1: 1 } })).toBe("en_cours");
    expect(etatExercice({ ...base, progression: { "1": 3, ex1: 2 } })).toBe("termine");
  });
  it("déduit l'état des exercices d'avant cette page", () => {
    expect(etatExercice({ ...base, progression: { "1": 3 }, entrees: [{ code: "s1:exo:1", reponse: "oui" }] })).toBe("en_cours");
    expect(etatExercice({ ...base, semaineCourante: 2, progression: { "1": 4 } })).toBe("termine");
  });
});

describe("jourEnCours", () => {
  it("compte les jours notés, plus aujourd'hui", () => {
    expect(jourEnCours(7, [], "2026-11-20")).toBe(1);
    expect(jourEnCours(7, ["2026-11-18", "2026-11-19"], "2026-11-20")).toBe(3);
    expect(jourEnCours(7, ["2026-11-19", "2026-11-20"], "2026-11-20")).toBe(2);
  });
});
