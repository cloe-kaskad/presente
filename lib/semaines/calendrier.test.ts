import { describe, expect, it } from "vitest";
import { arriveeApres, debutDe, semaineFaite, semaineOuverte } from "./calendrier";

const s = (jour: string) => Date.parse(`${jour}T10:00:00Z`) / 1000;

describe("le calendrier du chemin", () => {
  it("la semaine 1 commence avec le chemin, les autres le jour où elle les ouvre", () => {
    expect(debutDe(1, {}, "2026-11-16")).toBe("2026-11-16");
    expect(debutDe(2, {}, "2026-11-16")).toBeNull();
    expect(debutDe(2, { debut2: s("2026-11-24") })).toBe("2026-11-24");
  });
  it("la suivante arrive 7 jours après le début de la précédente", () => {
    expect(arriveeApres(1, {}, "2026-11-16")).toBe("2026-11-23");
  });
  it("s'ouvre le jour venu, finie ou non, et pas avant", () => {
    expect(semaineOuverte({ semaine: 1, progression: {}, dateDebut: "2026-11-16", aujourdhui: "2026-11-22" })).toBe(1);
    expect(semaineOuverte({ semaine: 1, progression: {}, dateDebut: "2026-11-16", aujourdhui: "2026-11-23" })).toBe(2);
    // La semaine 2 n'a pas encore été ouverte : la 3 attend.
    expect(semaineOuverte({ semaine: 1, progression: {}, dateDebut: "2026-11-16", aujourdhui: "2026-12-30" })).toBe(2);
    expect(semaineOuverte({ semaine: 2, progression: { debut2: s("2026-11-24") }, dateDebut: "2026-11-16", aujourdhui: "2026-12-01" })).toBe(3);
  });
  it("une semaine est faite quand toutes ses étapes le sont", () => {
    expect(semaineFaite(1, { "1": 4 })).toBe(true);
    expect(semaineFaite(1, { "1": 3 })).toBe(false);
    expect(semaineFaite(2, { "2": 3 })).toBe(true);
  });
});
