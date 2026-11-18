import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheminEnregistre } from "@/lib/chemin/donnees";
import { reponsesVides, type Reponses } from "@/lib/questionnaire/reponses";

vi.mock("server-only", () => ({}));

type Appel = { usage: string; message: string };
const appels: Appel[] = [];
let repondre: (a: Appel) => unknown = () => null;

vi.mock("@/lib/ia/claude", () => {
  const appeler = async (o: { usage: string; message: string }) => {
    const a = { usage: o.usage, message: o.message };
    appels.push(a);
    return repondre(a);
  };
  return {
    claudeDisponible: () => true,
    demanderJson: appeler,
    appelerJson: async (o: { usage: string; message: string }) => {
      const d = await appeler(o);
      return d === null ? { ok: false, raison: "simulé", ms: 0 } : { ok: true, data: d, ms: 0 };
    },
  };
});

const { ecrireLaCarte, tachesDeLaCarte } = await import("./ecriture");

const chemin: CheminEnregistre = {
  id: "p1",
  quetes: ["argent", "voix", "liens"],
  capacites: { argent: ["AR3", "AR6"], voix: ["VO1", "VO3"], liens: ["LI4", "LI6"] } as CheminEnregistre["capacites"],
  mondes: ["histoire", "philosophie_pratique", "attention_reseaux"],
  dateDebut: "2026-11-18",
  semaine: 1,
  choix: {},
};

function reponses(): Reponses {
  const r = reponsesVides();
  r[1].q1_1 = "Je me rends compte que je m'adapte tout le temps.";
  r[1].q1_3 = "ne plus baisser les yeux quand on parle d'argent";
  r[3].zoom.argent = { choisies: ["AR3"], intensite: { AR3: 5 }, autrement: "j'ai honte de ne rien comprendre à mes comptes" };
  return r;
}

const SYNTHESE_OK = {
  statut: "ok",
  ouverture: "Dès qu'il s'agit d'argent, quelque chose se ferme chez toi.",
  ce_qui_revient: "Tu écris « je m'adapte tout le temps ». Peut-être un même réflexe : ne pas faire de vagues.",
  d_ou_ca_vient: "Beaucoup de femmes ont appris que l'argent se règle ailleurs. Ce n'est pas un défaut personnel.",
  ce_qui_se_joue: "Être légitime sans avoir l'air de réclamer, peut-être.",
};

function bonneReponse(a: Appel) {
  if (a.usage === "detresse") return { detresse: false };
  if (a.usage.startsWith("verif:")) return { verdict: "ok", regle: null, raison: null };
  if (a.usage === "carte_synthese") return SYNTHESE_OK;
  if (a.usage === "capacite") return { statut: "ok", texte: "Regarder mes comptes sans honte." };
  return { statut: "ok", texte: "Une phrase juste, peut-être." };
}

beforeEach(() => {
  appels.length = 0;
  repondre = bonneReponse;
});

describe("le moteur d'écriture de la carte", () => {
  it("écrit tous les textes de la carte, chacun relu par une seconde passe", async () => {
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    expect(r.detresse).toBe(false);
    if (r.detresse) return;
    expect(r.textes).toHaveLength(tachesDeLaCarte(chemin).length);
    expect(r.textes.every((t) => t.statut === "ok")).toBe(true);
    const ecritures = appels.filter((a) => !a.usage.startsWith("verif:") && a.usage !== "detresse").length;
    expect(appels.filter((a) => a.usage.startsWith("verif:")).length).toBe(ecritures);
    // La capacité perd son point final
    expect(r.textes.find((t) => t.emplacement === "capacite")?.texte).toBe("Regarder mes comptes sans honte");
  });

  it("n'écrit que ce qui manque", async () => {
    await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set(["carte_synthese:"]));
    expect(appels.some((a) => a.usage === "carte_synthese")).toBe(false);
  });

  it("un texte refusé est réécrit une fois, avec la raison du refus", async () => {
    let n = 0;
    repondre = (a) => {
      if (a.usage === "carte_pourquoi" && a.message.includes('"cle_test":"voix"') === false) {
        n++;
        return a.message.includes("essai_precedent_refuse")
          ? { statut: "ok", texte: "Tu as écrit « j'ai honte de ne rien comprendre à mes comptes »." }
          : { statut: "ok", texte: "Tu as écrit « je déteste l'argent »." };
      }
      return bonneReponse(a);
    };
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    if (r.detresse) throw new Error("pas de détresse attendue");
    expect(r.textes.filter((t) => t.emplacement === "carte_pourquoi").every((t) => t.statut === "ok")).toBe(true);
    expect(n).toBe(6); // 3 quêtes, 2 essais chacune
  });

  it("une citation inventée deux fois : texte de secours, sans même la seconde passe", async () => {
    repondre = (a) =>
      a.usage === "carte_pourquoi" ? { statut: "ok", texte: "Tu as écrit « je déteste l'argent »." } : bonneReponse(a);
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    if (r.detresse) throw new Error("pas de détresse attendue");
    const pourquoi = r.textes.filter((t) => t.emplacement === "carte_pourquoi");
    expect(pourquoi.every((t) => t.statut === "secours")).toBe(true);
    expect(appels.some((a) => a.usage === "verif:carte_pourquoi")).toBe(false);
  });

  it("la seconde passe dit KO : texte de secours", async () => {
    repondre = (a) => (a.usage === "verif:carte_synthese" ? { verdict: "ko", regle: 3, raison: "tranche" } : bonneReponse(a));
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    if (r.detresse) throw new Error("pas de détresse attendue");
    const s = r.textes.find((t) => t.emplacement === "carte_synthese")!;
    expect(s.statut).toBe("secours");
    expect(JSON.parse(s.texte).ce_qui_revient).toContain("L'Argent");
  });

  it("Claude ne répond pas : textes de secours, la carte s'affiche quand même", async () => {
    repondre = (a) => (a.usage === "detresse" ? { detresse: false } : null);
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    if (r.detresse) throw new Error("pas de détresse attendue");
    expect(r.textes.every((t) => t.statut === "secours")).toBe(true);
  });

  it("un signal fort dans ses réponses : rien n'est écrit", async () => {
    const rep = reponses();
    rep[1].q1_4 = "Parfois je pense au suicide.";
    const r = await ecrireLaCarte({ chemin, reponses: rep, sujetsAEviter: null }, new Set());
    expect(r.detresse).toBe(true);
    expect(appels).toHaveLength(0);
  });

  it("Claude repère une détresse : rien n'est écrit", async () => {
    repondre = (a) => (a.usage === "detresse" ? { detresse: true } : bonneReponse(a));
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    expect(r.detresse).toBe(true);
    expect(appels.map((a) => a.usage)).toEqual(["detresse"]);
  });

  it("le moteur renvoie « detresse » en écrivant : rien n'est enregistré", async () => {
    repondre = (a) => (a.usage === "carte_synthese" ? { ...SYNTHESE_OK, statut: "detresse" } : bonneReponse(a));
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    expect(r.detresse).toBe(true);
  });

  it("l'accroche du monde ne reçoit pas ses réponses", async () => {
    await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: null }, new Set());
    const accroche = appels.find((a) => a.usage === "monde_accroche")!;
    expect(accroche.message).not.toContain("honte");
    expect(accroche.message).toContain("1965");
  });

  it("un texte qui touche un sujet à éviter est remplacé", async () => {
    repondre = (a) =>
      a.usage === "monde_pourquoi" ? { statut: "ok", texte: "Parce que ta mère gérait tout, peut-être." } : bonneReponse(a);
    const r = await ecrireLaCarte({ chemin, reponses: reponses(), sujetsAEviter: "la maternité" }, new Set());
    if (r.detresse) throw new Error("pas de détresse attendue");
    expect(r.textes.filter((t) => t.emplacement === "monde_pourquoi").every((t) => t.statut === "secours")).toBe(true);
  });
});
