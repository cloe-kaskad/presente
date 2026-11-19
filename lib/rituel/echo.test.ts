import { describe, expect, it } from "vitest";
import { echoDuJour, extraitExact } from "./echo";

const c = (code: string, reponse: string, jour: string) => ({ code, question: "Q", reponse, jour });

describe("l'écho du carnet", () => {
  it("ne reprend qu'une réponse d'au moins dix jours", () => {
    expect(echoDuJour([c("a", "récent", "2026-11-15")], "2026-11-19", null)).toBeNull();
    expect(echoDuJour([c("a", "ancien", "2026-11-04")], "2026-11-19", null)?.reponse).toBe("ancien");
  });
  it("est le même toute la journée, et change d'un jour à l'autre", () => {
    const liste = [c("a", "un", "2026-11-01"), c("b", "deux", "2026-11-02"), c("c", "trois", "2026-11-03")];
    expect(echoDuJour(liste, "2026-11-19", null)).toEqual(echoDuJour(liste, "2026-11-19", null));
    expect(echoDuJour(liste, "2026-11-19", null)).not.toEqual(echoDuJour(liste, "2026-11-20", null));
  });
  it("jamais un sujet à éviter", () => {
    expect(echoDuJour([c("a", "Ma mère gérait tout", "2026-11-01")], "2026-11-19", "maternité")).toBeNull();
  });
  it("recopie ses mots tels quels : la réponse, ou sa première phrase", () => {
    expect(extraitExact("  court  ")).toBe("court");
    const long = "Une première phrase assez longue pour compter. " + "x".repeat(200);
    expect(extraitExact(long)).toBe("Une première phrase assez longue pour compter.");
  });
});
