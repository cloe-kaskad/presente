import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { decouperMondes } from "@/lib/moteur/decoupage";
import { ficheDeLEpisode } from "./fiche";
import { CARNETS, EPISODES, avantEpisodeDeSecours, remplir } from "./contenu";

const mondes = decouperMondes(fs.readFileSync("specs/mondes-v0.md", "utf8"));

describe("la fiche d'un épisode", () => {
  it("reprend le déroulé, sans le minutage", () => {
    const f = ficheDeLEpisode(mondes.histoire, 1);
    expect(f.idees.length).toBeGreaterThanOrEqual(4);
    expect(f.idees[0]).toMatch(/^Un guichet de banque/);
    expect(f.idees.join(" ")).not.toMatch(/\d+ à \d+ min/);
  });
  it("trouve un épisode de chaque monde", () => {
    for (const m of ["histoire", "philosophie_pratique", "attention_reseaux"] as const) {
      expect(ficheDeLEpisode(mondes[m], 1).idees.length).toBeGreaterThan(0);
      expect(ficheDeLEpisode(mondes[m], 2).idees.length).toBeGreaterThan(0);
    }
  });
});

describe("les questions fixes", () => {
  it("remplit les crochets avec ses mots, sinon la version par défaut", () => {
    expect(remplir(CARNETS.argent.s3, { scene: "mon père, porte fermée", capacite: "Regarder mes comptes" })).toBe(
      "Il y a deux semaines, tu avais noté : « mon père, porte fermée ». Sur « Regarder mes comptes », qu'est-ce qui a bougé depuis ? « Rien » est une réponse.",
    );
    expect(remplir(CARNETS.voix.s3, {})).toMatch(/^Depuis deux semaines/);
    expect(remplir(CARNETS.liens.s1, {})).toBe("Le prénom qui te vient quand tu lis le mot « lien ».");
  });
  it("le texte d'avant d'un épisode tombe sur « par défaut » s'il manque ses mots", () => {
    const ep = EPISODES.histoire[0];
    expect(avantEpisodeDeSecours(ep, "argent", {})).toBe(ep.avantTexte.defaut);
    expect(avantEpisodeDeSecours(ep, "argent", { sesMots: "j'ai honte" })).toContain("« j'ai honte »");
    expect(avantEpisodeDeSecours(ep, "creation", {})).toBe(ep.avantTexte.defaut);
  });
});
