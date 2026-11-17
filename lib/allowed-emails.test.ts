import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowedEmails } from "./allowed-emails";

describe("liste blanche", () => {
  const raw = " Cloe@Exemple.fr, stephanie@exemple.fr ;\nautre@exemple.fr ";

  it("lit une liste séparée par virgules, espaces ou retours à la ligne", () => {
    expect([...parseAllowedEmails(raw)]).toEqual([
      "cloe@exemple.fr",
      "stephanie@exemple.fr",
      "autre@exemple.fr",
    ]);
  });

  it("ignore la casse et les espaces", () => {
    expect(isEmailAllowed("  CLOE@exemple.fr ", raw)).toBe(true);
  });

  it("refuse un email absent", () => {
    expect(isEmailAllowed("intruse@exemple.fr", raw)).toBe(false);
  });

  it("refuse tout le monde si la liste est vide", () => {
    expect(isEmailAllowed("cloe@exemple.fr", "")).toBe(false);
    expect(isEmailAllowed("cloe@exemple.fr", undefined)).toBe(false);
  });

  it("refuse un email vide", () => {
    expect(isEmailAllowed("", raw)).toBe(false);
    expect(isEmailAllowed(null, raw)).toBe(false);
  });
});
