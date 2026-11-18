/** Les écrans du questionnaire, dans l'ordre. Un identifiant par écran, pour reprendre au même endroit. */
import { QUESTIONS_OUVERTES, QUETES, type QueteId } from "./contenu";

export const TITRES_PARTIES: Record<number, string> = {
  1: "Tes mots",
  2: "Les sept quêtes",
  3: "Le zoom",
  4: "Le fil rouge",
  5: "Pour régler ton chemin",
};

export function listeEtapes(quetesZoom: QueteId[]): string[] {
  return [
    "intro",
    ...QUESTIONS_OUVERTES.map((q) => `p1:${q.id}`),
    ...QUETES.map((q) => `p2:${q}`),
    "p2:appelle",
    ...quetesZoom.map((q) => `p3:${q}`),
    "p4:filrouge",
    "p4:pasencore",
    "p5:temps",
    "p5:formats",
    "p5:sujets",
    "p5:inspiration",
    "p5:toi",
    "fin",
  ];
}

export function partieDe(etape: string): number {
  const m = /^p([1-5]):/.exec(etape);
  return m ? Number(m[1]) : 0;
}

/** Où reprendre : l'écran enregistré s'il existe encore, sinon le premier zoom, sinon le début. */
export function indexDeReprise(etapes: string[], enregistree: string | null | undefined): number {
  if (!enregistree) return 0;
  const i = etapes.indexOf(enregistree);
  if (i >= 0) return i;
  if (enregistree.startsWith("p3:")) {
    const j = etapes.findIndex((e) => e.startsWith("p3:"));
    if (j >= 0) return j;
  }
  return 0;
}
