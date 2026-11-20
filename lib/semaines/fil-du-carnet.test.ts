import { describe, expect, it } from "vitest";
import { filDuCarnet, periode } from "./fil-du-carnet";

const e = (semaine: number, code: string, reponse: string, creee: string, question = "Q", retour: string | null = null) => ({ semaine, code, reponse, creee, question, retour });

describe("filDuCarnet", () => {
  const fil = filDuCarnet({
    semaineCourante: 3,
    retours: { parle: "ça m'a parlé" },
    infos: {
      1: { titre: "Semaine 1 · L'Argent", contenu: { titre: "La porte", type: "Podcast" }, pratique: { nom: "Ce que mes oui achètent", agir: false, total: 7 } },
      3: { titre: "Semaine 3 · L'Argent", contenu: { titre: "Le silence", type: "Podcast" } },
    },
    entrees: [
      e(1, "s1:carnet:1", "On ne naît pas nulle", "2026-11-04T09:00:00Z", "La phrase"),
      e(1, "s1:carnet:2", "Mon père", "2026-11-04T09:01:00Z", "À qui"),
      e(1, "s1:retour", "", "2026-11-04T09:02:00Z", "Ce contenu", "parle"),
      e(1, "s1:exo:jour:2026-11-05", "Oui à la réunion", "2026-11-05T20:00:00Z", "Ce que mes oui achètent · Jeudi"),
      e(1, "s1:exo:jour:2026-11-06", "Oui au dîner", "2026-11-06T20:00:00Z"),
      e(3, "qc:recabc", "De ne pas lui laisser les comptes", "2026-11-19T10:00:00Z", "Qu'est-ce qu'on doit"),
      e(3, "echo:2026-11-17", "Plus tout à fait", "2026-11-17T10:00:00Z", "C'est toujours vrai ?"),
      e(3, "s3:avant", "", "2026-11-16T10:00:00Z"),
    ],
  });
  it("regroupe par semaine, la plus récente en haut, et date chaque note", () => {
    expect(fil.map((s) => [s.n, s.cetteSemaine, s.notes.length])).toEqual([
      [3, true, 2],
      [1, false, 3],
    ]);
    expect(fil[0].notes.map((n) => [n.jour, n.origine])).toEqual([
      ["2026-11-19", "La Question Chérie"],
      ["2026-11-17", "Écho du carnet"],
    ]);
  });
  it("donne l'origine et la pastille", () => {
    const s1 = fil[1].notes;
    expect(s1.map((n) => [n.origine, n.pastille, n.lignes.length])).toEqual([
      ["Exercice · Ce que mes oui achètent", "jour 2 sur 7", 1],
      ["Exercice · Ce que mes oui achètent", "jour 1 sur 7", 1],
      ["Après le podcast « La porte »", "ça m'a parlé", 2],
    ]);
  });
});

describe("periode", () => {
  it("dit les dates de la semaine", () => {
    expect(periode("2026-11-16", "2026-11-22")).toBe("du 16 au 22 novembre");
    expect(periode("2026-10-30", "2026-11-01")).toBe("du 30 octobre au 1er novembre");
    expect(periode("2026-11-19", "2026-11-19")).toBe("le 19 novembre");
  });
});
