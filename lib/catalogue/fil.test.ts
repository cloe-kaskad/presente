import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { choisirLecture } from "./fil";
import { fichierAudio, guideDeLaSemaine } from "./guides";

const L = (quete: string, semaine: string, capacite = "", statut = "Validé") => ({ quete, semaine, capacite, statut });

describe("Tirer le fil : la lecture de la capacité de la semaine", () => {
  const lignes = [L("La Voix", "1"), L("La Voix", "", "VO3"), L("La Création", "", "CR2"), L("La Création", "", "CR4", "Brouillon")];
  it("la lecture de la capacité travaillée", () => {
    expect(choisirLecture(lignes, "La Voix", 3, "VO3")).toMatchObject({ capacite: "VO3" });
    expect(choisirLecture(lignes, "La Création", 1, "cr2")).toMatchObject({ capacite: "CR2" });
  });
  it("sinon la lecture générale de la quête et de la semaine", () => {
    expect(choisirLecture(lignes, "La Voix", 1, "VO7")).toMatchObject({ semaine: "1", capacite: "" });
  });
  it("sinon rien : pas de texte hors sujet", () => {
    expect(choisirLecture(lignes, "La Voix", 3, "VO7")).toBeNull();
    expect(choisirLecture(lignes, "La Création", 3, "CR4")).toBeNull(); // pas validée
  });
});

describe("le fichier du guidage", () => {
  it("lit le champ « Audio (fichier) », seulement un nom de fichier simple", () => {
    expect(fichierAudio("cinq-minutes-assise.m4a", "x")).toBe("cinq-minutes-assise.m4a");
    expect(fichierAudio("../secret.mp3", "x")).toBeNull();
  });
  it("en phase de test, reconnaît les trois guidages prévus par leur nom", () => {
    expect(fichierAudio("", "Trois souffles avant de répondre")).toBe("trois-souffles.m4a");
    expect(fichierAudio("", "Autre chose")).toBeNull();
  });
});

describe("la pause guidée des semaines 2 et 4", () => {
  const P = (id: string, quete: string, audio: string | null = "a.m4a") => ({ id, nom: id, quete, audio });
  const pratiques = [P("souffles", "voix"), P("assise", "emotions"), P("corps", "corps"), P("ordinaire", "voix", null)];
  it("jamais en semaine 1 ou 3", () => {
    expect(guideDeLaSemaine(pratiques, "voix", 1)).toBeNull();
    expect(guideDeLaSemaine(pratiques, "voix", 3)).toBeNull();
  });
  it("semaine 2 : celle de sa quête ; semaine 4 : une autre", () => {
    expect(guideDeLaSemaine(pratiques, "corps", 2)?.id).toBe("corps");
    expect(guideDeLaSemaine(pratiques, "corps", 4)?.id).not.toBe("corps");
    expect(guideDeLaSemaine(pratiques, "creation", 6)).not.toBeNull();
  });
  it("seulement des pratiques avec un audio", () => {
    expect(guideDeLaSemaine(pratiques, "voix", 8)?.id).not.toBe("ordinaire");
  });
});
