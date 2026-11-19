import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { apercuDepuisHtml, resumer } = await import("./apercu");

describe("l'aperçu d'un contenu", () => {
  it("lit l'image et le résumé Open Graph, dans n'importe quel ordre d'attributs", () => {
    const html = `<head>
      <meta content="Un épisode sur l&#39;argent &amp; la honte." property="og:description">
      <meta property='og:image' content='/couverture.jpg'>
      <meta name="description" content="autre">
    </head>`;
    const a = apercuDepuisHtml(html, "https://exemple.fr/podcast/37");
    expect(a.image).toBe("https://exemple.fr/couverture.jpg");
    expect(a.description).toBe("Un épisode sur l'argent & la honte.");
  });

  it("rien trouvé : rien affiché", () => {
    expect(apercuDepuisHtml("<html></html>", "https://exemple.fr")).toEqual({ image: null, description: null });
  });

  it("un long résumé est coupé en fin de phrase", () => {
    const long = "Première phrase assez longue pour compter. ".repeat(20);
    const r = resumer(long, 120);
    expect(r.length).toBeLessThanOrEqual(120);
    expect(r.endsWith(".")).toBe(true);
  });
});
