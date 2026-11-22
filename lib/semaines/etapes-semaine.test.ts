import { describe, expect, it } from "vitest";
import { etapesDeLaSemaine, prochaineEtape } from "./etapes-semaine";

const lundi = Date.parse("2026-11-16T10:00:00Z") / 1000;
const podcast = { type: "Podcast", format: "ecouter", temps: "moyen" };

describe("les étapes de la semaine", () => {
  it("semaine de quête : contenu, carnet, exercice, avec leur état", () => {
    const e = etapesDeLaSemaine({
      n: 3,
      progression: { "3": 3 },
      entrees: [
        { code: "s3:carnet:1", reponse: "a" },
        { code: "s3:carnet:2", reponse: "b" },
      ],
      contenu: podcast,
      exercice: { n: 3, nom: "X", agir: true, rythme: "Une semaine", etat: "en_cours", total: null, notes: 0, jour: null, fin: null, aujourdhuiNote: false },
      pratique: null,
      ecoute: lundi,
    });
    expect(e.map((x) => [x.libelle, x.etat, x.droite])).toEqual([
      ["Podcast écouté", "faite", "lundi"],
      ["Ton carnet", "faite", "2 notes"],
      ["Ton geste", "en_cours", "en cours"],
    ]);
    expect(prochaineEtape(e)?.action).toBe("Reprendre mon geste");
  });
  it("rien de fait : la prochaine étape est le contenu", () => {
    const e = etapesDeLaSemaine({ n: 1, progression: {}, entrees: [], contenu: podcast, exercice: null, pratique: { nom: "Y", rythme: "Une fois" }, ecoute: null });
    expect(e.map((x) => x.etat)).toEqual(["a_faire", "a_faire", "a_faire"]);
    expect(prochaineEtape(e)?.action).toBe("Écouter le podcast");
  });
  it("exercice sur plusieurs jours, jour noté : tu es à jour", () => {
    const e = etapesDeLaSemaine({
      n: 1,
      progression: {},
      entrees: [{ code: "s1:carnet:1", reponse: "a" }],
      contenu: podcast,
      exercice: { n: 1, nom: "X", agir: false, rythme: "Une semaine", etat: "en_cours", total: 7, notes: 3, jour: 3, fin: null, aujourdhuiNote: true },
      pratique: null,
      ecoute: lundi,
    });
    expect(e[2].droite).toBe("jour 3 sur 7");
    expect(prochaineEtape(e)).toBeNull();
  });
  it("semaine de monde : épisode, questions, palier", () => {
    const e = etapesDeLaSemaine({ n: 4, progression: { "4": 3 }, entrees: [{ code: "s4:adapter:1", reponse: "x" }], contenu: null, exercice: null, pratique: null, ecoute: lundi });
    expect(e.map((x) => [x.cle, x.etat])).toEqual([
      ["episode", "faite"],
      ["questions", "faite"],
      ["palier", "a_faire"],
    ]);
  });
});

describe("« Tirer le fil » dans la semaine", () => {
  const base = { n: 1, progression: {}, entrees: [], contenu: { type: "Podcast", format: "ecouter", temps: "moyen" }, exercice: null, pratique: null, ecoute: null };
  it("n'apparaît que s'il y en a un de validé", () => {
    expect(etapesDeLaSemaine({ ...base, fil: null }).map((e) => e.cle)).toEqual(["contenu", "carnet"]);
    const e = etapesDeLaSemaine({ ...base, fil: { lu: null } });
    expect(e.at(-1)).toMatchObject({ libelle: "Tirer le fil", etat: "a_faire", droite: "5 min de lecture", href: "/semaine/1/fil" });
  });
});
