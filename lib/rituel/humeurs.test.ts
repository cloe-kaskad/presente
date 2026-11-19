import { describe, expect, it } from "vitest";
import { troisJoursLourds } from "./humeurs";

describe("trois jours lourds", () => {
  it("trois jours de suite parmi triste, lourde, anxieuse", () => {
    const j = [
      { jour: "2026-11-17", humeur: "triste" },
      { jour: "2026-11-18", humeur: "anxieuse" },
      { jour: "2026-11-19", humeur: "lourde" },
    ];
    expect(troisJoursLourds(j, "2026-11-19")).toBe(true);
    expect(troisJoursLourds(j, "2026-11-20")).toBe(true); // pas encore noté aujourd'hui
    expect(troisJoursLourds(j, "2026-11-22")).toBe(false);
  });
  it("un jour léger ou un trou casse la série", () => {
    expect(
      troisJoursLourds(
        [
          { jour: "2026-11-17", humeur: "triste" },
          { jour: "2026-11-18", humeur: "calme" },
          { jour: "2026-11-19", humeur: "lourde" },
        ],
        "2026-11-19",
      ),
    ).toBe(false);
    expect(troisJoursLourds([{ jour: "2026-11-17", humeur: "triste" }, { jour: "2026-11-19", humeur: "lourde" }], "2026-11-19")).toBe(false);
  });
});
