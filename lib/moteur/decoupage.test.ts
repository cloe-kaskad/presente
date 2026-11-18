import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { decouperMondes, decouperPrompt } from "./decoupage";

describe("le découpage des prompts", () => {
  const { ecriture, verification } = decouperPrompt(fs.readFileSync("prompts/moteur-ecriture.md", "utf8"));

  it("le prompt d'écriture contient la posture et les emplacements de la carte", () => {
    expect(ecriture).toMatch(/^Tu écris pour Présente!/);
    expect(ecriture).toContain("Emplacement `carte_synthese`");
    expect(ecriture).toContain("Emplacement `capacite`");
    expect(ecriture).not.toContain("Tu relis un texte écrit");
  });

  it("le prompt de vérification contient les 7 règles et rien d'autre", () => {
    expect(verification).toMatch(/^# Seconde passe/);
    expect(verification).toContain("La longueur respecte l'emplacement");
    expect(verification).not.toContain("Tu écris pour Présente!");
  });

  it("chaque monde a son plan", () => {
    const m = decouperMondes(fs.readFileSync("specs/mondes-v0.md", "utf8"));
    expect(m.histoire).toContain("1965");
    expect(m.philosophie_pratique).toContain("Qu'est-ce qu'une vie choisie");
    expect(m.attention_reseaux).toContain("Se comparer sans fin");
    expect(m.histoire).not.toContain("Philosophie pratique\n");
  });
});
