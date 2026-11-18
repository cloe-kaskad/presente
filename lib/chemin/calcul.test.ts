import { describe, expect, it, vi } from "vitest";
import type { CodeCapacite, QueteId } from "@/lib/questionnaire/contenu";
import {
  calculerChemin,
  capacitesDe,
  classement,
  echangerQuete,
  ordonner,
  quetesDuZoom,
  score,
  troisQuetes,
  type Dependances,
  type EntreeChemin,
  type Positions,
} from "./calcul";

const sansClaude: Dependances = {
  departage: async () => null,
  choisirCapacites: async () => [],
};

/** Le profil de Camille, celui des maquettes : L'Argent, puis La Voix, puis Les Liens. */
const camille: EntreeChemin = {
  positions: {
    argent: { ou: 2, envie: 5 }, // 20
    voix: { ou: 1, envie: 4 }, // 20
    liens: { ou: 2, envie: 4 }, // 16
    travail: { ou: 3, envie: 3 }, // 9
    emotions: { ou: 3, envie: 3 }, // 9
    corps: { ou: 4, envie: 2 }, // 4
    creation: { ou: 4, envie: 2 }, // 4
  },
  appelle: "L'argent. J'en ai marre d'avoir honte de mes comptes.",
  zoom: {
    argent: { choisies: ["AR6", "AR3"], intensite: { AR3: 5, AR6: 3 }, autrement: "j'ai honte de ne rien comprendre à mes comptes" },
    voix: { choisies: ["VO1", "VO3"], intensite: { VO1: 4, VO3: 4 } },
    liens: { choisies: ["LI6", "LI4"], intensite: { LI6: 2, LI4: 5 } },
  },
};

describe("le score d'une quête", () => {
  it("vaut (6 moins « où j'en suis ») fois « mon envie », de 1 à 25", () => {
    expect(score(1, 5)).toBe(25);
    expect(score(5, 1)).toBe(1);
    expect(score(2, 5)).toBe(20);
    expect(score(3, 3)).toBe(9);
  });

  it("met un curseur non touché à 3, et borne les valeurs hors limites", () => {
    expect(classement({})).toHaveLength(7);
    expect(score(0, 9)).toBe(score(1, 5));
  });

  it("une quête où elle subit sans envie ne passe pas devant une quête qui l'appelle", () => {
    const p: Positions = { argent: { ou: 1, envie: 1 }, voix: { ou: 3, envie: 5 } };
    expect(classement(p).indexOf("voix")).toBeLessThan(classement(p).indexOf("argent"));
  });
});

describe("le zoom", () => {
  it("affiche les 3 meilleurs scores", () => {
    expect(quetesDuZoom(camille.positions)).toEqual(["argent", "voix", "liens"]);
  });

  it("en affiche 4 en cas d'égalité au 3e rang", () => {
    const p: Positions = {
      argent: { ou: 1, envie: 5 }, // 25
      voix: { ou: 2, envie: 5 }, // 20
      liens: { ou: 3, envie: 4 }, // 12
      creation: { ou: 2, envie: 3 }, // 12
      travail: { ou: 5, envie: 1 },
      emotions: { ou: 5, envie: 1 },
      corps: { ou: 5, envie: 1 },
    };
    expect(quetesDuZoom(p)).toEqual(["argent", "voix", "liens", "creation"]);
  });
});

describe("les 3 quêtes et leur ordre", () => {
  it("Camille : L'Argent (l'élan), La Voix (le plus loin), Les Liens", async () => {
    const chemin = await calculerChemin(camille, sansClaude);
    expect(chemin.quetes).toEqual(["argent", "voix", "liens"]);
    expect(chemin.mondes).toEqual(["histoire", "philosophie_pratique", "attention_reseaux"]);
  });

  it("Camille : ses capacités cochées, la plus forte d'abord", async () => {
    const chemin = await calculerChemin(camille, sansClaude);
    expect(chemin.capacites.argent).toEqual(["AR3", "AR6"]);
    expect(chemin.capacites.voix).toEqual(["VO1", "VO3"]);
    expect(chemin.capacites.liens).toEqual(["LI4", "LI6"]);
  });

  const egalite: Positions = {
    argent: { ou: 1, envie: 5 }, // 25
    voix: { ou: 2, envie: 5 }, // 20
    liens: { ou: 3, envie: 4 }, // 12, envie 4
    creation: { ou: 2, envie: 3 }, // 12, envie 3
    travail: { ou: 5, envie: 1 },
    emotions: { ou: 5, envie: 1 },
    corps: { ou: 5, envie: 1 },
  };

  it("deux quêtes à égalité, réponse ouverte claire : la quête nommée l'emporte", async () => {
    const departage = vi.fn(async (_t: string, candidates: QueteId[]) =>
      candidates.includes("creation") ? ("creation" as QueteId) : null,
    );
    const trois = await troisQuetes(egalite, "La création. Je ne peins plus depuis des années.", departage);
    expect(departage).toHaveBeenCalledWith(expect.any(String), ["liens", "creation"]);
    expect(trois).toEqual(["argent", "voix", "creation"]);
  });

  it("deux quêtes à égalité, rien d'exploitable : l'envie la plus haute l'emporte", async () => {
    const trois = await troisQuetes(egalite, "je ne sais pas trop", async () => null);
    expect(trois).toEqual(["argent", "voix", "liens"]);
  });

  it("deux quêtes à égalité, réponse vide : Claude n'est pas appelé", async () => {
    const departage = vi.fn(async () => null);
    const trois = await troisQuetes(egalite, "   ", departage);
    expect(departage).not.toHaveBeenCalled();
    expect(trois).toEqual(["argent", "voix", "liens"]);
  });

  it("une réponse de Claude hors des candidates est ignorée", async () => {
    const trois = await troisQuetes(egalite, "le corps", async () => "corps");
    expect(trois).toEqual(["argent", "voix", "liens"]);
  });

  it("une erreur de Claude n'empêche pas de tracer le chemin", async () => {
    const trois = await troisQuetes(egalite, "la création", async () => {
      throw new Error("réseau");
    });
    expect(trois).toEqual(["argent", "voix", "liens"]);
  });

  it("sans égalité au 3e rang, Claude n'est pas appelé", async () => {
    const departage = vi.fn(async () => null);
    await troisQuetes(camille.positions, camille.appelle, departage);
    expect(departage).not.toHaveBeenCalled();
  });

  it("l'ordre : égalité d'envie au mois 1, le score départage", () => {
    const p: Positions = {
      argent: { ou: 3, envie: 5 }, // 15
      voix: { ou: 1, envie: 5 }, // 25
      liens: { ou: 2, envie: 3 }, // 12
    };
    expect(ordonner(["argent", "voix", "liens"], p)).toEqual(["voix", "liens", "argent"]);
  });

  it("l'ordre : égalité de « où j'en suis » au mois 2, le score départage", () => {
    const p: Positions = {
      argent: { ou: 2, envie: 5 },
      voix: { ou: 2, envie: 3 }, // 12
      liens: { ou: 2, envie: 4 }, // 16
    };
    expect(ordonner(["voix", "liens", "argent"], p)).toEqual(["argent", "liens", "voix"]);
  });
});

describe("les capacités", () => {
  it("aucune capacité cochée : les deux viennent de Claude", async () => {
    const choisir = vi.fn(async () => ["AR5", "AR2"] as CodeCapacite[]);
    const c = await capacitesDe("argent", {}, choisir);
    expect(choisir).toHaveBeenCalledWith({ quete: "argent", exclues: [], nombre: 2 });
    expect(c).toEqual(["AR5", "AR2"]);
  });

  it("une seule cochée : la seconde vient de Claude, sans doublon", async () => {
    const choisir = vi.fn(async () => ["AR3", "AR7"] as CodeCapacite[]);
    const c = await capacitesDe("argent", { argent: { choisies: ["AR3"] } }, choisir);
    expect(choisir).toHaveBeenCalledWith({ quete: "argent", exclues: ["AR3"], nombre: 1 });
    expect(c).toEqual(["AR3", "AR7"]);
  });

  it("des codes d'une autre quête renvoyés par Claude sont ignorés", async () => {
    const c = await capacitesDe("argent", {}, async () => ["VO1", "LI2"] as CodeCapacite[]);
    expect(c).toEqual(["AR1", "AR2"]);
  });

  it("aucune cochée et Claude indisponible : on ne bloque pas", async () => {
    const c = await capacitesDe("voix", {}, async () => {
      throw new Error("pas de clé");
    });
    expect(c).toEqual(["VO1", "VO2"]);
  });

  it("une case cochée d'une autre quête est ignorée", async () => {
    const c = await capacitesDe("argent", { argent: { choisies: ["VO1", "AR4"] } }, async () => ["AR1"]);
    expect(c).toEqual(["AR4", "AR1"]);
  });
});

describe("échanger une quête", () => {
  it("remplace par la 4e meilleure et recalcule l'ordre", async () => {
    const chemin = await calculerChemin(camille, sansClaude);
    const nouveau = await echangerQuete(chemin, "argent", undefined, camille, sansClaude);
    // 4e meilleure de Camille : Le Travail (9, ordre des specs devant Les Émotions)
    expect(nouveau.quetes).toEqual(["voix", "liens", "travail"]);
    expect(nouveau.capacites.voix).toEqual(chemin.capacites.voix);
    expect(nouveau.capacites.travail).toEqual(["TR1", "TR2"]);
    expect(nouveau.capacites).not.toHaveProperty("argent");
  });

  it("remplace par celle qu'elle choisit", async () => {
    const chemin = await calculerChemin(camille, sansClaude);
    const nouveau = await echangerQuete(chemin, "liens", "creation", camille, sansClaude);
    expect(new Set(nouveau.quetes)).toEqual(new Set(["argent", "voix", "creation"]));
    expect(nouveau.quetes[0]).toBe("argent");
  });

  it("refuse une quête déjà dans le chemin", async () => {
    const chemin = await calculerChemin(camille, sansClaude);
    await expect(echangerQuete(chemin, "liens", "voix", camille, sansClaude)).rejects.toThrow();
  });
});

describe("l'aperçu en direct (écran Échanger)", () => {
  it("donne le même chemin que le calcul complet", async () => {
    const { apercuTroisQuetes } = await import("./calcul");
    expect(apercuTroisQuetes(camille.positions, () => null)).toEqual(["argent", "voix", "liens"]);
  });
  it("se recompose quand elle bouge un curseur", async () => {
    const { apercuTroisQuetes } = await import("./calcul");
    const p = { ...camille.positions, creation: { ou: 1, envie: 5 } };
    expect(apercuTroisQuetes(p, () => null)).toEqual(["creation", "voix", "argent"]);
  });
});
