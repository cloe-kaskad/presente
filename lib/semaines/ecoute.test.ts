import { describe, expect, it } from "vitest";
import { ecouteLe } from "./ecoute";

describe("ecouteLe", () => {
  it("lit la date enregistrée, ou l'annulation", () => {
    expect(ecouteLe(1, { ecoute1: 1763300000 }, [])).toBe(1763300000);
    expect(ecouteLe(1, { ecoute1: 0 }, [{ code: "s1:carnet:1", reponse: "x", creee: "2026-11-16T10:00:00Z" }])).toBeNull();
  });
  it("avant ce changement : un carnet rempli vaut écoute", () => {
    expect(ecouteLe(1, {}, [{ code: "s1:carnet:1", reponse: "x", creee: "2026-11-16T10:00:00Z" }])).toBe(Date.parse("2026-11-16T10:00:00Z") / 1000);
    expect(ecouteLe(1, { "1": 2 }, [{ code: "s1:avant", reponse: "x", creee: "2026-11-16T10:00:00Z" }])).toBeNull();
  });
});
