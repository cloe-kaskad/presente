import { describe, expect, it } from "vitest";
import { signauxDeDetresse } from "./detresse";
import { capaciteALaPremierePersonne, citations, garderMotsExacts, verifierRegles } from "./regles";

const sources = ["j'ai honte de ne rien comprendre à mes comptes", "Ma sœur fait les comptes, porte fermée."];

describe("les règles du moteur", () => {
  it("accepte un texte qui cite ses mots exacts", () => {
    const r = verifierRegles("carte_pourquoi", ["Tu as écrit « j’ai honte de ne rien comprendre à mes comptes ». On commence là."], sources, null);
    expect(r.ok).toBe(true);
  });

  it("accepte une citation qui ne diffère que par la ponctuation ou les majuscules", () => {
    expect(verifierRegles("carte_pourquoi", ["Tu as écrit « J'ai honte de ne rien comprendre à mes comptes. »"], sources, null).ok).toBe(true);
    expect(verifierRegles("carte_pourquoi", ["Tu parles de « porte fermée »."], sources, null).ok).toBe(true);
    expect(verifierRegles("carte_pourquoi", ["« j'ai honte… mes comptes »"], sources, null).ok).toBe(true);
  });

  it("refuse une citation dont un mot a changé", () => {
    expect(verifierRegles("carte_pourquoi", ["« j'ai honte de ne rien comprendre à mon compte »"], sources, null).ok).toBe(false);
    expect(verifierRegles("carte_pourquoi", ["« porte »"], ["apporte"], null).ok).toBe(false);
  });

  it("refuse une citation déformée", () => {
    const r = verifierRegles("carte_pourquoi", ["Tu as écrit « j'ai honte de mes comptes »."], sources, null);
    expect(r).toMatchObject({ ok: false, regle: 1 });
  });

  it("refuse les mots interdits et le tiret cadratin", () => {
    expect(verifierRegles("carte_pourquoi", ["Un chemin bienveillant."], sources, null)).toMatchObject({ ok: false, regle: 6 });
    expect(verifierRegles("carte_pourquoi", ["L'argent — enfin."], sources, null)).toMatchObject({ ok: false, regle: 6 });
    expect(verifierRegles("carte_pourquoi", ["Une vraie transformation."], sources, null)).toMatchObject({ ok: false, regle: 6 });
  });

  it("refuse un texte qui touche un sujet à éviter", () => {
    const r = verifierRegles("carte_pourquoi", ["Peut-être que ta mère t'a appris ce silence ?"], sources, "la maternité");
    expect(r).toMatchObject({ ok: false, regle: 5 });
  });

  it("une citation au plus dans la synthèse", () => {
    const blocs = ["« porte fermée »", "Et « porte fermée » encore.", "Rien.", "Rien."];
    expect(verifierRegles("carte_synthese", blocs, sources, null, 1)).toMatchObject({ ok: false, regle: 1 });
  });

  it("refuse un texte trop long ou vide", () => {
    expect(verifierRegles("capacite", ["a".repeat(120)], sources, null)).toMatchObject({ ok: false, regle: 7 });
    expect(verifierRegles("capacite", [" "], sources, null)).toMatchObject({ ok: false, regle: 7 });
  });

  it("repère les citations", () => {
    expect(citations("Tu as écrit « un » puis «deux».")).toEqual(["un", "deux"]);
  });

  it("met une capacité à la première personne", () => {
    expect(capaciteALaPremierePersonne("Regarder ses comptes sans honte, savoir où va son argent")).toBe(
      "Regarder mes comptes sans honte, savoir où va mon argent",
    );
    expect(capaciteALaPremierePersonne("S'autoriser à vouloir gagner plus, et à dépenser pour soi")).toBe(
      "M'autoriser à vouloir gagner plus, et à dépenser pour moi",
    );
    expect(capaciteALaPremierePersonne("Se sentir légitime")).toBe("Me sentir légitime");
  });
});

describe("les signaux de détresse", () => {
  it("repère les signaux forts", () => {
    expect(signauxDeDetresse("j'ai pensé au suicide")).toBe("fort");
    expect(signauxDeDetresse("certains jours j'ai envie de mourir")).toBe("fort");
  });
  it("laisse Claude trancher les phrases ambiguës", () => {
    expect(signauxDeDetresse("Parfois j'ai des idées noires")).toBe("ambigu");
    expect(signauxDeDetresse("Je n'ai plus envie de vivre comme ça")).toBe("ambigu");
  });
  it("ne s'alarme pas d'une fatigue ordinaire", () => {
    expect(signauxDeDetresse("Je suis épuisée, je veux changer de vie.")).toBeNull();
    expect(signauxDeDetresse("Mourir de rire avec mes amies me manque")).toBeNull();
  });
});

describe("tes mots, qu'on a gardés", () => {
  const src = ["j'ai honte de ne rien comprendre à mes comptes", "Mon père faisait les comptes, porte fermée.", "La maternité me fait peur"];
  it("ne garde que les citations exactes", () => {
    expect(garderMotsExacts(["« porte fermée »", "honte de mes comptes", "j’ai honte"], src, null)).toEqual(["porte fermée", "j’ai honte"]);
  });
  it("jamais un sujet à éviter, jamais de doublon, quatre au plus", () => {
    expect(garderMotsExacts(["La maternité me fait peur", "porte fermée", "Porte fermée."], src, "la maternité")).toEqual(["porte fermée"]);
    expect(garderMotsExacts(["honte", "comptes", "porte", "père", "fermée"], src, null)).toHaveLength(4);
  });
});
