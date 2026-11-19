/**
 * Les textes de secours de la carte : affichés quand le moteur n'a pas écrit,
 * ou quand son texte n'a pas passé la vérification. Sans personnalisation,
 * sauf ce qui est sûr (le nom des quêtes, ses mots exacts quand ils sont courts).
 */
import { pourquoiSecours } from "@/lib/chemin/textes";
import { QUETE, libelleCapacite, type CodeCapacite, type MondeId, type QueteId } from "@/lib/questionnaire/contenu";
import { capaciteALaPremierePersonne } from "./regles";

export type Synthese = {
  ouverture: string;
  ce_qui_revient: string;
  d_ou_ca_vient: string;
  ce_qui_se_joue: string;
  /** Trois ou quatre citations exactes de ses réponses (« Tes mots, qu'on a gardés »). */
  mots?: string[];
};

export const ACCROCHE_MONDE: Record<MondeId, string> = {
  histoire:
    "Jusqu'en 1965, une femme mariée ne pouvait pas ouvrir un compte sans l'accord de son mari. Comment l'argent du foyer est resté si longtemps dans la main d'un seul, et ce que ça laisse encore en nous.",
  philosophie_pratique:
    "Des idées qui servent un mardi soir. Pour distinguer ce que tu choisis vraiment de ce que tu continues par élan.",
  attention_reseaux:
    "Si tu n'arrives pas à poser ton téléphone, ce n'est pas un manque de volonté : c'est le résultat d'un travail de conception. Et ton attention est ce que tu as de plus précieux à donner.",
};

const POURQUOI_MONDE: Record<MondeId, string> = {
  histoire: "Parce que ce qu'on vit comme un trait de caractère a souvent une histoire, et que celle-ci éclaire ton premier mois.",
  philosophie_pratique: "Parce qu'avant de changer quelque chose, ça aide de savoir ce que tu choisis vraiment.",
  attention_reseaux: "Parce qu'on ne choisit bien que ce à quoi on peut prêter attention.",
};

export function syntheseDeSecours(quetes: QueteId[]): Synthese {
  const [a, b, c] = quetes.map((q) => QUETE[q].nom);
  return {
    ouverture: "Merci pour ce que tu as écrit. On a lu chaque réponse avant de tracer ton chemin.",
    ce_qui_revient: `Tes réponses reviennent vers ${a}, puis vers ${b} et ${c}. C'est par là que ton chemin passe.`,
    d_ou_ca_vient:
      "Ce qui nous freine a souvent une histoire, apprise bien avant nous. Ton chemin prendra le temps de la regarder, sans te juger.",
    ce_qui_se_joue: `On commence par ${a}, parce que c'est là que ton envie est la plus forte.`,
  };
}

export function pourquoiDeSecours(mois: 0 | 1 | 2, sesMots: string | undefined, sujets?: string | null): string {
  const p = pourquoiSecours(mois, sesMots, sujets);
  return p.citation ? `Tu as écrit « ${p.citation} ». ${p.suite}` : p.suite;
}

export const accrocheDeSecours = (m: MondeId) => ACCROCHE_MONDE[m];
export const pourquoiMondeDeSecours = (m: MondeId) => POURQUOI_MONDE[m];
export const capaciteDeSecours = (c: CodeCapacite) => capaciteALaPremierePersonne(libelleCapacite(c));
