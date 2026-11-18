import { describe, expect, it } from "vitest";
import { decrireContenu } from "./presentation";

describe("dire un contenu", () => {
  it("accorde la durée", () => {
    expect(decrireContenu({ type: "Podcast", temps: "court", entreeCourte: null })).toBe("Un podcast court");
    expect(decrireContenu({ type: "Vidéo", temps: "court", entreeCourte: null })).toBe("Une vidéo courte");
    expect(decrireContenu({ type: "Livre", temps: "long", entreeCourte: null })).toBe("Un livre");
  });
  it("donne l'entrée courte d'un livre", () => {
    expect(decrireContenu({ type: "Livre", temps: "long", entreeCourte: "Le chapitre 3" })).toBe(
      "Un livre, en commençant par le chapitre 3",
    );
  });
});
