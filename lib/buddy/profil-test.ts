/**
 * La buddy de test (brief V0.10 et V0.11) : un profil fictif écrit à l'avance, jamais de l'IA en direct.
 * Partout où elle apparaît à partir de la rencontre, la mention « Profil de test : Inès n'existe pas. » reste visible.
 * Textes provisoires : Cloé les réécrira. Ses réponses suivent l'ordre de QUESTIONS_BUDDY_MOIS.
 * Aux questions « quelle phrase t'est restée ? » (4, 8, 12), elle reprend une phrase de la testeuse : voir phraseRetenueParInes.
 */
export const INES = {
  prenom: "Inès",
  presentation: "J'ai trente-huit ans et j'ai longtemps cru que me taire, c'était être gentille.",
  reponses: [
    "J'ai dit à ma sœur que je ne viendrais pas dimanche. Sans inventer d'excuse. Elle n'a rien dit, et le ciel ne m'est pas tombé dessus.",
    "Une heure de piscine, seule, sans écouteurs. Je n'ai rien produit, rien appris. C'était à moi.",
    "Au travail, quand on m'a demandé de reprendre le dossier d'une collègue. J'ai dit oui en souriant et j'ai râlé tout le trajet.",
    "Celle-là m'a accompagnée toute la semaine.",
    "Appeler ma banque pour comprendre où va mon épargne. Je le sais depuis deux ans.",
    "Qu'on me trouve égoïste. Qu'on dise « elle a changé » comme si c'était un reproche.",
    "Que je n'ai plus envie de faire semblant au dîner du dimanche. Je ne sais pas encore quoi en faire.",
    "Je l'ai recopiée dans mon carnet.",
    "Je ne m'excuse plus avant de parler en réunion. Personne ne l'a vu, mais moi, je l'entends.",
    "Je ne dirai plus « ce n'est pas grave » quand ça l'est.",
    "Que ça valait la peine de commencer, même sans savoir où ça allait.",
    "Elle m'a fait sourire, et elle m'a fait avancer.",
  ],
  /** Un mot pour la testeuse, une semaine sur deux (questions 2, 4, 6…). 140 caractères au plus. */
  mots: {
    2: "Ta réponse m'a donné envie d'essayer à mon tour.",
    4: "Merci pour ce mois. Je te lis toujours en premier.",
    6: "Je pense à toi quand je n'ose pas.",
    8: "On continue, et je suis contente que ce soit avec toi.",
    10: "Ce que tu as écrit cette semaine, je le garde.",
    12: "Trois mois. Merci d'avoir été là, même de loin.",
  } as Record<number, string>,
};

export const MENTION_TEST = "Profil de test : Inès n'existe pas.";

/** Aux questions « quelle phrase t'est restée ? », Inès reprend une phrase de ce que la testeuse a écrit ce mois-ci. */
export function phraseRetenueParInes(reponsesDuMois: string[]): string | null {
  for (const r of [...reponsesDuMois].reverse()) {
    const p = r.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).find((x) => x.length > 8);
    if (p) return p;
  }
  return null;
}
