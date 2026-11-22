import { describe, expect, it } from "vitest";
import { avisParContenu, dansLesSemaines, decrochage, entonnoir, rituel, rythme, type Evenement } from "./statistiques";

const e = (user_id: string, type: string, jour: string, semaine: number | null = null, cle: string | null = null): Evenement => ({ user_id, type, semaine, cle, jour, created_at: `${jour}T10:00:00Z` });

const evs: Evenement[] = [
  e("a", "questionnaire_commence", "2026-11-01"),
  e("b", "questionnaire_commence", "2026-11-01"),
  e("a", "questionnaire_termine", "2026-11-01"),
  e("a", "carte_vue", "2026-11-01"),
  e("a", "chemin_commence", "2026-11-01"),
  e("a", "semaine_ouverte", "2026-11-01", 1),
  e("a", "semaine_ouverte", "2026-11-09", 2),
  e("a", "contenu_ecoute", "2026-11-02", 1),
  e("a", "carnet_ecrit", "2026-11-02", 1),
  e("a", "avis_donne", "2026-11-02", 1, "moyen"),
  e("a", "avis_donne", "2026-11-03", 1, "parle"),
  e("a", "visite", "2026-11-20"),
  e("a", "humeur_notee", "2026-11-20", null, "2026-11-20"),
  e("a", "visite", "2026-11-21"),
];

describe("les chiffres de l'équipe", () => {
  it("l'entonnoir, avec le passage d'une étape à l'autre", () => {
    const l = entonnoir(evs);
    expect(l.map((x) => [x.nombre, x.part])).toEqual([
      [2, null],
      [1, 50],
      [1, 100],
      [1, 100],
      [1, 100],
      [1, 100],
    ]);
  });
  it("dans une semaine", () => {
    expect(dansLesSemaines(evs)[0]).toMatchObject({ semaine: 1, ouverte: 1, ecoute: 1, carnet: 1, exerciceCree: 0 });
  });
  it("le décrochage et le rythme", () => {
    expect(decrochage(evs, "2026-11-22")).toMatchObject({ total: 2, sept: 1, quatorze: 1 });
    expect(rythme(evs, "2026-11-22")).toEqual({ joursEntreDeuxSemaines: 8, visitesSur7Jours: 1 });
  });
  it("le rituel : part des jours de visite", () => {
    expect(rituel(evs)).toEqual({ joursDeVisite: 2, humeur: 50, questionCherie: 0, article: 0 });
  });
  it("les avis : le dernier de chaque personne, par contenu", () => {
    expect(avisParContenu(evs, () => "La porte")).toEqual([{ titre: "La porte", total: 1, choix: { parle: 1 } }]);
  });
});
