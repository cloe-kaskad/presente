import { describe, expect, it } from "vitest";
import { CITATIONS, citationDuJour, dateEnLettres, jourAParis } from "./citations";

describe("la citation du jour", () => {
  it("est la même toute la journée, et change le lendemain", () => {
    expect(citationDuJour("2026-11-19")).toEqual(citationDuJour("2026-11-19"));
    expect(citationDuJour("2026-11-19")).not.toEqual(citationDuJour("2026-11-20"));
  });
  it("ne cite que des femmes nommées, avec une source", () => {
    for (const c of CITATIONS) expect(c.autrice && c.source && c.texte).toBeTruthy();
  });
  it("donne la date en lettres, à Paris", () => {
    expect(dateEnLettres("2026-11-19")).toBe("Jeudi 19 novembre");
    expect(jourAParis(new Date("2026-11-19T23:30:00Z"))).toBe("2026-11-20");
  });
});

describe("les semaines", async () => {
  const { lundiDe, plusJours } = await import("./citations");
  it("trouve le lundi", () => {
    expect(lundiDe("2026-11-19")).toBe("2026-11-16");
    expect(lundiDe("2026-11-16")).toBe("2026-11-16");
    expect(lundiDe("2026-11-22")).toBe("2026-11-16");
    expect(plusJours("2026-11-30", 1)).toBe("2026-12-01");
  });
});
