import { describe, expect, it } from "vitest";
import { questionsApres, versionLongue } from "./contenu";

describe("les questions après un contenu", () => {
  it("version courte pour tous, version longue si bousculante ou au mois 3", () => {
    expect(questionsApres("ecouter", versionLongue("douce", 0)).map((q) => q.texte)).toEqual([
      "La phrase que tu as envie de noter.",
      "À qui as-tu pensé en écoutant ?",
    ]);
    expect(questionsApres("lire", versionLongue("bousculante", 0)).map((q) => q.texte)).toEqual([
      "La phrase que tu as envie de noter.",
      "À qui as-tu pensé en lisant ?",
      "Dans ton corps, où est-ce que ça a réagi ?",
    ]);
    expect(versionLongue(null, 2)).toBe(true);
    expect(versionLongue("franche", 1)).toBe(false);
  });
});
