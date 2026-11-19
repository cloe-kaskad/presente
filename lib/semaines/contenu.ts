/**
 * Le contenu fixe des semaines : les questions ne sont jamais réécrites par l'IA.
 * Sources : specs/questions-avant-apres-v0.md (carnets, questions avant et après) et specs/mondes-v0.md
 * (mini-questionnaires). Les crochets [scène], [personne], [capacité] sont remplis avec ses propres mots ;
 * sinon la version « par défaut » s'affiche.
 */
import type { MondeId, QueteId } from "@/lib/questionnaire/contenu";

// ---------------------------------------------------------------------------
// Les carnets de quête (semaines 1 et 3)
// ---------------------------------------------------------------------------

export type QuestionCarnet = { texte: string; adapter?: boolean; ligne?: boolean };

export type CarnetSemaine = {
  /** La question « avant », très courte. Peut contenir [scène], [personne], [capacité]. */
  avant: string;
  /** La même, quand elle n'a rien écrit d'utilisable pour les crochets. */
  avantParDefaut?: string;
  avantLigne?: boolean;
  apres: [QuestionCarnet, QuestionCarnet, QuestionCarnet];
};

export type CarnetQuete = {
  s1: CarnetSemaine;
  s3: CarnetSemaine;
  /** D'où viennent [scène] et [personne] en semaine 3 : un code de question de la semaine 1. */
  sources: { scene?: "avant" | "apres2"; personne?: "avant" | "apres2" };
  /** Vrai pour les quatre quêtes dont les questions sont un gabarit provisoire, à valider par Cloé. */
  provisoire?: boolean;
};

export const CARNETS: Record<QueteId, CarnetQuete> = {
  argent: {
    s1: {
      avant: "En un mot : ce que le mot « argent » te fait, là, maintenant.",
      avantLigne: true,
      apres: [
        { texte: "La phrase que tu as envie de noter." },
        { texte: "À quelle scène de ta vie ça t'a fait penser ? Où, et avec qui.", adapter: true },
        { texte: "Qu'est-ce que tu ne savais pas, ou que tu ne voulais pas savoir ?" },
      ],
    },
    s3: {
      avant: "Il y a deux semaines, tu avais noté : « [scène] ». Sur « [capacité] », qu'est-ce qui a bougé depuis ? « Rien » est une réponse.",
      avantParDefaut: "Il y a deux semaines, tu as ouvert cette quête. Sur « [capacité] », qu'est-ce qui a bougé depuis ? « Rien » est une réponse.",
      apres: [
        { texte: "Ce que cette personne fait avec l'argent, et que tu ne fais pas encore." },
        { texte: "Dans ta vie, où est-ce que ça pourrait se jouer cette semaine ? Une situation précise, une personne.", adapter: true },
        { texte: "Ce qui te retient, en une phrase." },
      ],
    },
    sources: { scene: "apres2" },
  },
  voix: {
    s1: {
      avant: "Le dernier moment où tu n'as pas dit ce que tu pensais : en trois mots.",
      avantLigne: true,
      apres: [
        { texte: "La phrase que tu as envie de noter." },
        { texte: "À qui as-tu pensé en écoutant ?", adapter: true, ligne: true },
        { texte: "Dans ton corps, où est-ce que ça a réagi ?" },
      ],
    },
    s3: {
      avant: "Il y a deux semaines, tu avais pensé à [personne]. Depuis, y a-t-il eu une fois où tu as dit quelque chose que tu n'aurais pas dit avant ?",
      avantParDefaut: "Depuis deux semaines, y a-t-il eu une fois où tu as dit quelque chose que tu n'aurais pas dit avant ?",
      apres: [
        { texte: "La phrase ou le geste que tu voudrais lui emprunter." },
        { texte: "Où vas-tu en avoir besoin cette semaine ? Une situation, une personne.", adapter: true },
        { texte: "Qu'est-ce que tu risques, vraiment ?" },
      ],
    },
    sources: { personne: "apres2" },
  },
  liens: {
    s1: {
      avant: "Le prénom qui te vient quand tu lis le mot « lien ».",
      avantLigne: true,
      apres: [
        { texte: "La phrase que tu as envie de noter." },
        { texte: "Dans quelle relation de ta vie est-ce que ça résonne ?", adapter: true },
        { texte: "Qu'est-ce que tu as reconnu de toi, et qui ne t'a pas plu ?" },
      ],
    },
    s3: {
      avant: "Il y a deux semaines, tu avais nommé [personne]. Qu'est-ce qui a bougé entre vous depuis ? « Rien » est une réponse.",
      avantParDefaut: "Depuis deux semaines, qu'est-ce qui a bougé dans tes liens ? « Rien » est une réponse.",
      apres: [
        { texte: "Ce que tu voudrais oser dans un lien." },
        { texte: "Avec qui, cette semaine ?", adapter: true, ligne: true },
        { texte: "Qu'est-ce que tu as peur de perdre ?" },
      ],
    },
    sources: { personne: "avant" },
  },
  // Gabarit provisoire, calqué sur L'Argent, pour les quatre quêtes sans carnet dans les specs.
  travail: gabarit("travail"),
  emotions: gabarit("émotion"),
  corps: gabarit("corps"),
  creation: gabarit("créer"),
};

function gabarit(mot: string): CarnetQuete {
  return {
    provisoire: true,
    s1: {
      avant: `En un mot : ce que le mot « ${mot} » te fait, là, maintenant.`,
      avantLigne: true,
      apres: [
        { texte: "La phrase que tu as envie de noter." },
        { texte: "À quelle scène de ta vie ça t'a fait penser ? Où, et avec qui.", adapter: true },
        { texte: "Qu'est-ce que tu as reconnu de toi ?" },
      ],
    },
    s3: {
      avant: "Il y a deux semaines, tu avais noté : « [scène] ». Sur « [capacité] », qu'est-ce qui a bougé depuis ? « Rien » est une réponse.",
      avantParDefaut: "Il y a deux semaines, tu as ouvert cette quête. Sur « [capacité] », qu'est-ce qui a bougé depuis ? « Rien » est une réponse.",
      apres: [
        { texte: "Ce que tu voudrais emprunter à ce contenu." },
        { texte: "Où est-ce que ça pourrait se jouer cette semaine ? Une situation précise, une personne.", adapter: true },
        { texte: "Ce qui te retient, en une phrase." },
      ],
    },
    sources: { scene: "apres2" },
  };
}

/** Remplit les crochets avec ses mots ; s'il en manque un, la version par défaut. */
export function remplir(semaine: CarnetSemaine, valeurs: { scene?: string; personne?: string; capacite?: string }): string {
  const manque = (t: string) =>
    (t.includes("[scène]") && !valeurs.scene) ||
    (t.includes("[personne]") && !valeurs.personne) ||
    (t.includes("[capacité]") && !valeurs.capacite);
  const modele = manque(semaine.avant) && semaine.avantParDefaut ? semaine.avantParDefaut : semaine.avant;
  return modele
    .replace("[scène]", valeurs.scene ?? "")
    .replace("[personne]", valeurs.personne ?? "")
    .replace("[capacité]", valeurs.capacite ?? "ce que tu travailles ce mois-ci");
}

// ---------------------------------------------------------------------------
// Les épisodes de monde (semaines 2 et 4)
// ---------------------------------------------------------------------------

export type ChampMini =
  | { type: "texte"; label: string; ligne?: boolean }
  | { type: "choix"; label: string; options: string[] }
  | { type: "curseur"; label: string; gauche: string; droite: string }
  | { type: "annee"; label: string };

export type QuestionMini = {
  code: string;
  texte: string;
  champs: ChampMini[];
  adapter?: boolean;
};

export type Episode = {
  titre: string;
  /** La question d'avant, avec sa forme (specs/questions-avant-apres-v0.md). */
  avant: QuestionMini;
  /** Le texte d'avant de secours, selon sa quête (version « par défaut » sinon). */
  avantTexte: Partial<Record<QueteId, string>> & { defaut: string };
  formeApres: string;
  apres: QuestionMini[];
  /** La question de sa quête, après (pour L'Argent, La Voix, Les Liens). */
  questionQuete: Partial<Record<QueteId, string>>;
};

const curseurChoisie: ChampMini = { type: "curseur", label: "Aujourd'hui, ma vie me semble…", gauche: "plutôt arrivée", droite: "plutôt choisie" };

export const EPISODES: Record<MondeId, [Episode, Episode]> = {
  histoire: [
    {
      titre: "Elle avait un compte, pas la main",
      avant: {
        code: "avant",
        texte: "À ton avis, depuis quand une femme mariée gère-t-elle à égalité avec son mari les biens du couple ?",
        champs: [{ type: "choix", label: "Ton intuition", options: ["1907", "1944", "1965", "1985"] }],
      },
      avantTexte: {
        argent: "Tu as écrit : « [ses mots] ». Cet épisode raconte d'où vient cette phrase. Elle est plus vieille que toi.",
        voix: "Pendant longtemps, une femme mariée n'avait pas à donner son avis sur l'argent du foyer : la loi le donnait pour elle. Écoute en pensant aux endroits où tu attends encore qu'on te demande.",
        liens: "Cet épisode parle d'argent, mais surtout de ce que la loi a fait aux couples et aux familles. Écoute-le en pensant à [personne].",
        defaut: "Ce que tu vas entendre s'est passé du vivant de ta mère ou de ta grand-mère.",
      },
      formeApres: "la frise de ta lignée",
      apres: [
        {
          code: "frise",
          texte: "Place l'année de naissance de ta mère et de ta grand-mère. À ton âge, qui gérait leur argent ?",
          champs: [
            { type: "annee", label: "Ta grand-mère est née en" },
            { type: "annee", label: "Ta mère est née en" },
            { type: "texte", label: "À ton âge, qui gérait leur argent ?" },
          ],
        },
        {
          code: "fait",
          texte: "Lequel des quatre faits t'a le plus surprise, et à qui aurais-tu envie de le raconter ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
        },
        {
          code: "adapter",
          texte: "Aujourd'hui, dans ta vie, qu'est-ce qui est à ton nom, et qu'est-ce que tu ne sais pas ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
          adapter: true,
        },
      ],
      questionQuete: {
        argent: "Dans ce que tu as entendu, qu'est-ce qui ressemble à la façon dont l'argent se passe chez toi aujourd'hui ?",
        voix: "Sur quel sujet attends-tu encore qu'on te donne la parole, alors que tu as le droit de la prendre ?",
        liens: "Dans ta famille, qui avait la main sur l'argent, et qui l'a aujourd'hui ?",
      },
    },
    {
      titre: "Celles qu'on a effacées",
      avant: {
        code: "avant",
        texte: "Sans chercher : cite une femme qui a fait ton métier, ou ce que tu aimes faire, avant toi. « Aucune ne me vient » est une réponse.",
        champs: [{ type: "texte", label: "Un nom, ou « aucune ne me vient »", ligne: true }],
      },
      avantTexte: {
        argent: "Être effacée a aussi un prix : un travail qu'on ne voit pas ne se paie pas. Écoute en pensant à ce que tu fais et qu'on ne compte pas.",
        voix: "Tu as écrit : « [ses mots] ». Cet épisode montre qu'on n'a pas seulement fait taire des femmes : on a retiré les mots qui les désignaient.",
        liens: "Dans chaque famille, il y a une femme dont on parle peu. Écoute en pensant à elle.",
        defaut: "Tu vas rencontrer des femmes dont tu aurais dû entendre parler à l'école.",
      },
      formeApres: "la lettre courte",
      apres: [
        {
          code: "lettre",
          texte:
            "Dans ton métier ou dans ce que tu aimes faire, connais-tu une femme qui l'a fait avant toi ? Si oui, écris-lui la question que tu lui poserais. Si non, qu'est-ce que ça te fait ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
        },
        { code: "famille", texte: "Dans ta famille, de quelle femme a-t-on peu parlé ? Que sais-tu d'elle ?", champs: [{ type: "texte", label: "Ta réponse" }] },
        {
          code: "adapter",
          texte: "Une chose que tu as faite et qui porte le nom de quelqu'un d'autre.",
          champs: [{ type: "texte", label: "Ta réponse" }],
          adapter: true,
        },
      ],
      questionQuete: {
        argent: "Qu'est-ce que tu fais qui n'est compté nulle part ?",
        voix: "Quel mot te manque pour dire ce que tu es ou ce que tu fais ?",
        liens: "Qu'aimerais-tu demander à la femme de ta famille dont on parle peu ?",
      },
    },
  ],
  philosophie_pratique: [
    {
      titre: "Qu'est-ce qu'une vie choisie ?",
      avant: { code: "avant", texte: "Aujourd'hui, ma vie me semble plutôt choisie, ou plutôt arrivée ?", champs: [curseurChoisie] },
      avantTexte: {
        argent:
          "On dit souvent qu'on n'a pas le choix « à cause de l'argent ». Parfois c'est vrai, parfois c'est une phrase. Cet épisode aide à faire la différence.",
        voix: "Dire non, demander, donner son avis : tout cela suppose de savoir ce qu'on veut. C'est le sujet de cet épisode.",
        liens: "Tu as écrit : « [ses mots] ». Cet épisode pose une question simple : dans tes liens, qu'est-ce que tu as choisi ?",
        defaut: "Trois idées anciennes, pour regarder ta semaine autrement.",
      },
      formeApres: "le tri",
      apres: [
        { code: "curseur", texte: "Le même curseur, après l'écoute.", champs: [curseurChoisie] },
        {
          code: "tri",
          texte: "Prends trois choses importantes de ta vie actuelle. Classe chacune : choisie, héritée, subie.",
          champs: [
            { type: "texte", label: "Première chose", ligne: true },
            { type: "choix", label: "Elle est", options: ["choisie", "héritée", "subie"] },
            { type: "texte", label: "Deuxième chose", ligne: true },
            { type: "choix", label: "Elle est", options: ["choisie", "héritée", "subie"] },
            { type: "texte", label: "Troisième chose", ligne: true },
            { type: "choix", label: "Elle est", options: ["choisie", "héritée", "subie"] },
          ],
        },
        {
          code: "idee",
          texte: "Laquelle des trois idées (Épictète, Beauvoir, Spinoza) te sert le plus aujourd'hui, et pour quelle situation ?",
          champs: [
            { type: "choix", label: "L'idée", options: ["Épictète", "Beauvoir", "Spinoza"] },
            { type: "texte", label: "Pour quelle situation ?" },
          ],
        },
        {
          code: "adapter",
          texte: "Cette semaine, une chose qui a augmenté ta puissance d'agir, une qui l'a diminuée.",
          champs: [
            { type: "texte", label: "Ce qui l'a augmentée", ligne: true },
            { type: "texte", label: "Ce qui l'a diminuée", ligne: true },
          ],
          adapter: true,
        },
      ],
      questionQuete: {
        argent: "Une décision d'argent que tu as prise par habitude, et que tu pourrais reprendre.",
        voix: "Un oui que tu donnes par élan ancien, sans l'avoir redécidé.",
        liens: "Une relation que tu choisirais à nouveau aujourd'hui, et une que tu continues.",
      },
    },
    {
      titre: "Vivre avec les autres sans se perdre",
      avant: { code: "avant", texte: "Devant qui es-tu le plus toi ? Un prénom.", champs: [{ type: "texte", label: "Un prénom", ligne: true }] },
      avantTexte: {
        argent: "On se perd aussi par l'argent : payer pour être aimée, ne rien demander pour ne pas peser. Écoute avec ça en tête.",
        voix: "Tu as écrit : « [ses mots] ». Cet épisode parle du moment précis où l'on s'accorde à l'autre avant même d'avoir pensé.",
        liens: "C'est l'épisode de ta quête. Écoute-le en pensant à [personne].",
        defaut: "Une soirée réussie dont on rentre vide : cet épisode part de là.",
      },
      formeApres: "les phrases à compléter",
      apres: [
        {
          code: "devenir",
          texte: "« Avec ___, je deviens ___. » Trois fois, avec trois personnes différentes.",
          champs: [
            { type: "texte", label: "Avec…", ligne: true },
            { type: "texte", label: "je deviens…", ligne: true },
            { type: "texte", label: "Avec…", ligne: true },
            { type: "texte", label: "je deviens…", ligne: true },
            { type: "texte", label: "Avec…", ligne: true },
            { type: "texte", label: "je deviens…", ligne: true },
          ],
        },
        {
          code: "adapter",
          texte: "« La dernière fois que j'ai été d'accord sans l'être, c'était ___. »",
          champs: [{ type: "texte", label: "C'était…" }],
          adapter: true,
        },
        {
          code: "role",
          texte: "Cette semaine, j'étais plus près de jouer un rôle, ou d'être là ?",
          champs: [{ type: "curseur", label: "Cette semaine", gauche: "jouer un rôle", droite: "être là" }],
        },
      ],
      questionQuete: {
        argent: "Qu'est-ce que tu paies, en argent ou autrement, pour garder ta place auprès de quelqu'un ?",
        voix: "Devant qui ta voix change-t-elle, et comment ?",
        liens: "Avec la personne à qui tu penses, qu'est-ce que tu montres, et qu'est-ce que tu gardes ?",
      },
    },
  ],
  attention_reseaux: [
    {
      titre: "Qui décide de ce que je regarde ?",
      avant: {
        code: "avant",
        texte: "Devine ton temps d'écran d'hier, sans regarder. Écris le chiffre.",
        champs: [{ type: "texte", label: "Ton estimation (en heures)", ligne: true }],
      },
      avantTexte: {
        argent: "Ton attention est une monnaie : des entreprises la vendent. Cet épisode te montre à quel prix.",
        voix: "Difficile de savoir ce qu'on pense quand on écoute les autres penser toute la journée. Écoute en te demandant quand tu entends ta propre voix.",
        liens: "L'attention, c'est aussi ce qu'on donne aux gens qu'on aime. Écoute en pensant à qui reçoit la tienne.",
        defaut: "Si tu n'arrives pas à poser ton téléphone, ce n'est pas un manque de volonté. Tu vas comprendre pourquoi.",
      },
      formeApres: "le relevé",
      apres: [
        {
          code: "releve",
          texte: "Ouvre le temps d'écran de ton téléphone. Le chiffre d'hier, et ta réaction en un mot.",
          champs: [
            { type: "texte", label: "Le chiffre d'hier", ligne: true },
            { type: "texte", label: "Ta réaction, en un mot", ligne: true },
          ],
        },
        {
          code: "adapter",
          texte: "L'application que tu ouvres sans l'avoir décidé : qu'est-ce que tu viens y chercher ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
          adapter: true,
        },
        { code: "heure", texte: "Une chose à laquelle tu voudrais donner cette heure.", champs: [{ type: "texte", label: "Ta réponse", ligne: true }] },
      ],
      questionQuete: {
        argent: "Qu'as-tu acheté, ou voulu acheter, à cause de ce que tu as regardé ?",
        voix: "À quel moment de la journée entends-tu ta propre pensée ?",
        liens: "Qui mériterait l'heure que ton téléphone a eue hier ?",
      },
    },
    {
      titre: "Se comparer sans fin",
      avant: {
        code: "avant",
        texte: "La dernière personne à qui tu t'es comparée. Un prénom ou un compte.",
        champs: [{ type: "texte", label: "Un prénom ou un compte", ligne: true }],
      },
      avantTexte: {
        argent: "On se compare beaucoup sur ce que les autres ont. Cet épisode aide à distinguer ce que tu veux de ce qu'on te montre.",
        voix: "Se comparer fait taire : on se dit que d'autres le disent mieux. Écoute avec ça en tête.",
        liens: "Tu as écrit : « [ses mots] ». On se compare surtout à celles qui nous ressemblent : des amies, des sœurs, des collègues.",
        defaut: "Se comparer est normal. Ce qui a changé, c'est à combien de personnes.",
      },
      formeApres: "le portrait",
      apres: [
        {
          code: "portrait",
          texte: "Pense à un compte ou à une personne qui te fait te sentir moins bien. Qu'a-t-elle que tu crois ne pas avoir ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
        },
        {
          code: "adapter",
          texte: "Est-ce que tu le veux vraiment, ou est-ce qu'on t'a appris à le vouloir ?",
          champs: [{ type: "texte", label: "Ta réponse" }],
          adapter: true,
        },
        {
          code: "grandir",
          texte: "Un compte, une personne ou un lieu d'où tu ressors plus grande.",
          champs: [{ type: "texte", label: "Ta réponse", ligne: true }],
        },
      ],
      questionQuete: {
        argent: "Une dépense que tu as faite pour ressembler à quelqu'un.",
        voix: "Qu'est-ce que tu ne dis pas, ou ne montres pas, parce que d'autres le font mieux ?",
        liens: "Une amie que tu envies : que se passerait-il si tu le lui disais ?",
      },
    },
  ],
};

/** Le texte d'avant de secours d'un épisode : sa quête si elle a de quoi remplir les crochets, sinon « par défaut ». */
export function avantEpisodeDeSecours(ep: Episode, quete: QueteId, valeurs: { sesMots?: string; personne?: string }): string {
  const t = ep.avantTexte[quete];
  if (!t) return ep.avantTexte.defaut;
  if (t.includes("[ses mots]") && !valeurs.sesMots) return ep.avantTexte.defaut;
  if (t.includes("[personne]") && !valeurs.personne) return ep.avantTexte.defaut;
  return t.replace("[ses mots]", valeurs.sesMots ?? "").replace("[personne]", valeurs.personne ?? "");
}

// ---------------------------------------------------------------------------
// Les retours de l'acte et le palier
// ---------------------------------------------------------------------------

export const QUESTIONS_ACTE: QuestionCarnet[] = [
  { texte: "Ce qui s'est passé, en quelques lignes." },
  { texte: "Ce que tu as eu envie de dire ou de faire à la place." },
  { texte: "Ce que tu en gardes." },
];

export const QUESTIONS_PALIER = [
  { code: "bouge", texte: "Qu'est-ce qui a bougé ?", souffle: "Même un tout petit peu." },
  { code: "resiste", texte: "Qu'est-ce qui résiste encore ?", souffle: "Ça aussi, c'est une information." },
];
