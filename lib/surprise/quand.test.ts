import { describe, expect, it } from "vitest";
import { surpriseArrivee, surpriseOuverte } from "./quand";

describe("la surprise", () => {
  it("arrive au dixième jour, sans l'annoncer avant", () => {
    expect(surpriseArrivee({}, "2026-11-16", "2026-11-24")).toBe(false);
    expect(surpriseArrivee({}, "2026-11-16", "2026-11-25")).toBe(true);
  });
  it("arrive tout de suite quand l'équipe la déclenche", () => {
    expect(surpriseArrivee({ surprise: 1 }, "2026-11-16", "2026-11-17")).toBe(true);
  });
  it("se souvient qu'elle a été ouverte", () => {
    expect(surpriseOuverte({ surprise_vue: 1 })).toBe(true);
    expect(surpriseOuverte({})).toBe(false);
  });
});
