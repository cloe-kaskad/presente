import { describe, expect, it } from "vitest";
import { codeLu, codeRange, departDe } from "./depart";

describe("revenir à la première semaine", () => {
  it("au premier départ, rien ne change", () => {
    expect(codeRange("s1:carnet:a", 0)).toBe("s1:carnet:a");
    expect(codeLu("s1:carnet:a", 0)).toBe("s1:carnet:a");
  });
  it("au nouveau départ, les réponses des semaines sont rangées à part", () => {
    expect(codeRange("s1:carnet:a", 2)).toBe("r2:s1:carnet:a");
    expect(codeLu("r2:s1:carnet:a", 2)).toBe("s1:carnet:a");
  });
  it("les réponses d'avant sont mises de côté, jamais effacées", () => {
    expect(codeLu("s1:carnet:a", 1)).toBeNull();
    expect(codeLu("r1:s1:carnet:a", 2)).toBeNull();
    expect(codeLu("r1:s1:carnet:a", 0)).toBeNull();
  });
  it("l'échange à deux est mis de côté aussi ; les réponses du jour ne bougent pas", () => {
    expect(codeRange("qc:rec1", 2)).toBe("qc:rec1");
    expect(codeRange("buddy:e3q1", 2)).toBe("r2:buddy:e3q1");
    expect(codeLu("buddy:q1", 2)).toBeNull();
    expect(codeLu("echo:2026-11-20", 3)).toBe("echo:2026-11-20");
  });
  it("lit le numéro du départ", () => {
    expect(departDe({ depart: 2 })).toBe(2);
    expect(departDe({})).toBe(0);
  });
});

import { enDemo, nouveauDepart, stadeGarde } from "./depart";

describe("le vrai stade, gardé pendant la démo", () => {
  const reel = { "1": 4, "2": 3, debut2: 100, surprise: 5, buddy: 1, buddy_echange: 1 };
  it("repart à zéro en gardant le vrai stade de côté", () => {
    const p = nouveauDepart(reel, "2026-11-01");
    expect(p.depart).toBe(1);
    expect(p["1"]).toBeUndefined();
    expect(p.buddy_echange).toBe(2);
    expect(enDemo(p)).toBe(true);
  });
  it("un deuxième « Revenir à la première semaine » garde le vrai stade d'origine", () => {
    const p1 = nouveauDepart(reel, "2026-11-01");
    const p2 = nouveauDepart({ ...p1, "1": 2 }, "2026-11-27");
    expect(p2.depart).toBe(2);
    expect(stadeGarde(p2)?.dateDebut).toBe("2026-11-01");
    expect(stadeGarde(p2)?.progression["1"]).toBe(4);
  });
  it("« Revenir au stade réel » retrouve sa progression et son jour de début", () => {
    const g = stadeGarde(nouveauDepart(reel, "2026-11-01"));
    expect(g?.dateDebut).toBe("2026-11-01");
    expect(g?.progression).toEqual({ ...reel, depart_max: 1, buddy_max: 2 });
    expect(stadeGarde(reel)).toBeNull();
  });
});

describe("une démo ne retrouve jamais la précédente", () => {
  it("après un retour au stade réel, le départ suivant a un nouveau numéro", () => {
    const reel = { "1": 4, buddy: 1, buddy_echange: 1 };
    const demo1 = nouveauDepart(reel, "2026-11-01");
    const retour = stadeGarde(demo1)!.progression;
    const demo2 = nouveauDepart(retour, "2026-11-01");
    expect(demo2.depart).toBe(2);
    expect(demo2.buddy_echange).toBe(3);
    expect(retour.buddy_echange).toBe(1); // ses vraies réponses à deux reviennent
  });
});
