import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { choisirLecture } from "./fil";

const L = (quete: string, semaine: string, statut = "Validé") => ({ quete, semaine, statut });

describe("Tirer le fil : quelle lecture montrer", () => {
  const lignes = [L("La Voix", "1"), L("Le Corps", "3", "Proposé")];
  it("la lecture écrite pour la quête et la semaine", () => {
    expect(choisirLecture(lignes, "La Voix", 1, true)).toMatchObject({ quete: "La Voix", exemple: false });
  });
  it("en phase de test, sans lecture écrite : une autre, marquée « exemple »", () => {
    expect(choisirLecture(lignes, "La Création", 3, true)).toMatchObject({ quete: "La Voix", exemple: true });
    expect(choisirLecture(lignes, "La Voix", 3, true)).toMatchObject({ quete: "La Voix", exemple: true });
  });
  it("après le lancement : rien, l'étape n'existe pas", () => {
    expect(choisirLecture(lignes, "La Création", 3, false)).toBeNull();
  });
  it("une lecture seulement proposée n'est jamais montrée", () => {
    expect(choisirLecture([L("Le Corps", "3", "Proposé")], "Le Corps", 3, true)).toBeNull();
  });
});

import { fichierAudio } from "./guides";
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
