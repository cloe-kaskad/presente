import { describe, expect, it } from "vitest";
import { choisirContenu, choisirPratique, type DemandeSemaine, type ProfilChoix } from "./choix";
import { racinesAEviter, situationsDecrites, supposeAutreChose, toucheSujet } from "./filtres";
import type { Catalogue, Contenu, Pratique } from "./types";

function contenu(id: string, x: Partial<Contenu>): Contenu {
  return {
    id,
    source: "hors_mediatheque",
    titre: id,
    auteur: "",
    type: "Podcast",
    lien: null,
    description: null,
    image: null,
    quete: "argent",
    capacites: [],
    role: null,
    intensite: null,
    registre: null,
    format: "ecouter",
    temps: "court",
    acces: null,
    aEviterSi: "",
    supposeQue: "",
    entreeCourte: null,
    pourquoi: null,
    ...x,
  };
}

function pratique(id: string, x: Partial<Pratique>): Pratique {
  return {
    id,
    nom: id,
    quete: "argent",
    capacites: [],
    role: "ouvrir",
    formeReponse: "Texte libre",
    rythme: null,
    intensite: "douce",
    adaptation: null,
    enBref: null,
    consigne: null,
    regles: null,
    pourquoiCaCompte: null,
    ...x,
  };
}

const profil: ProfilChoix = { temps: "1h", formats: ["ecouter"], sesMots: "Je travaille dans une agence." };
const s1: DemandeSemaine = { quete: "argent", semaine: 1, capacites: ["AR3", "AR6"] };
const s3: DemandeSemaine = { quete: "argent", semaine: 3, capacites: ["AR3", "AR6"] };

describe("les filtres", () => {
  it("écarte une famille de sujets à partir d'un seul mot", () => {
    const r = racinesAEviter("Je préfère éviter la maternité pour l'instant");
    expect(toucheSujet(r, "Abandon par un parent, maternité")).toBe(true);
    expect(toucheSujet(r, "Être mère sans se perdre")).toBe(true);
    expect(toucheSujet(r, "Négocier son salaire")).toBe(false);
  });

  it("ne se laisse pas piéger par les mots communs de sa phrase", () => {
    const r = racinesAEviter("Je préfère éviter de parler de tout ça pour le moment");
    expect(toucheSujet(r, "Pour tout dire, parler d'argent")).toBe(false);
  });

  it("repère les situations qu'elle décrit", () => {
    const s = situationsDecrites("Je vis avec mon compagnon et je suis freelance.");
    expect([...s].sort()).toEqual(["couple", "independante"]);
    expect(situationsDecrites("Je vis seule.").size).toBe(0);
  });

  it("dans le doute, écarte un contenu qui suppose une situation non décrite", () => {
    expect(supposeAutreChose("mère", new Set())).toBe(true);
    expect(supposeAutreChose("en couple", new Set(["couple"]))).toBe(false);
    expect(supposeAutreChose("", new Set())).toBe(false);
    expect(supposeAutreChose("valeur inconnue", new Set())).toBe(true);
  });
});

describe("le choix du contenu", () => {
  it("prend un contenu tagué avec la capacité de la semaine", () => {
    const cat: Catalogue = {
      contenus: [contenu("a", { capacites: ["AR6"] }), contenu("b", { capacites: ["AR3"] })],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, profil).contenu?.id).toBe("b");
    expect(choisirContenu(cat, s3, profil).contenu?.id).toBe("a");
  });

  it("préfère son format, puis le bon rôle", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("lire", { capacites: ["AR3"], format: "lire", role: "ouvrir" }),
        contenu("ecouter", { capacites: ["AR3"], format: "ecouter", role: "comprendre" }),
      ],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, profil).contenu?.id).toBe("ecouter");
  });

  it("n'envoie jamais un contenu qui touche un sujet à éviter", () => {
    const cat: Catalogue = {
      contenus: [contenu("a", { capacites: ["AR3"], aEviterSi: "Maternité" })],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, { ...profil, sujetsAEviter: "la maternité" }).contenu).toBeNull();
  });

  it("n'envoie jamais un contenu qui suppose une situation qu'elle n'a pas décrite", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("couple", { capacites: ["AR3"], supposeQue: "en couple", format: "ecouter" }),
        contenu("toutes", { capacites: ["AR3"], format: "lire" }),
      ],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, profil).contenu?.id).toBe("toutes");
    expect(choisirContenu(cat, s1, { ...profil, sesMots: "mon mari et moi" }).contenu?.id).toBe("couple");
  });

  it("respecte son temps : 30 minutes, un contenu court d'abord", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("long", { capacites: ["AR3"], temps: "long" }),
        contenu("moyen", { capacites: ["AR3"], temps: "moyen" }),
        contenu("court", { capacites: ["AR3"], temps: "court", format: "lire" }),
      ],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, { ...profil, temps: "30min" }).contenu?.id).toBe("court");
  });

  it("30 minutes : jamais un livre entier, sauf avec une entrée courte", () => {
    const livre = contenu("livre", { capacites: ["AR3"], temps: "long", format: "lire" });
    expect(choisirContenu({ contenus: [livre], pratiques: [] }, s1, { ...profil, temps: "30min" }).contenu).toBeNull();
    const avecEntree = { ...livre, entreeCourte: "Le chapitre 2" };
    expect(choisirContenu({ contenus: [avecEntree], pratiques: [] }, s1, { ...profil, temps: "30min" }).contenu?.id).toBe("livre");
  });

  it("sans contenu pour la capacité, prend l'autre capacité du mois, puis la quête", () => {
    const cat: Catalogue = {
      contenus: [contenu("quete", { capacites: ["AR1"] }), contenu("autre", { capacites: ["AR6"] })],
      pratiques: [],
    };
    const r = choisirContenu(cat, s1, profil);
    expect(r.contenu?.id).toBe("autre");
    expect(r.capacite).toBe("AR6");
    expect(choisirContenu({ contenus: [cat.contenus[0]], pratiques: [] }, s1, profil).capacite).toBeNull();
  });

  it("ne propose jamais deux fois le même contenu, et varie la voix", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("a", { capacites: ["AR6"], auteur: "Ma juste valeur" }),
        contenu("b", { capacites: ["AR6"], auteur: "Autre voix", type: "Texte", format: "lire" }),
      ],
      pratiques: [],
    };
    expect(choisirContenu(cat, { ...s3, dejaPris: ["a"] }, profil).contenu?.id).toBe("b");
    const precedent = { auteur: "Ma juste valeur", registre: null, type: "Podcast" };
    expect(choisirContenu(cat, { ...s3, precedent }, profil).contenu?.id).toBe("b");
  });

  it("après trois jours lourds, préfère un contenu doux", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("franc", { capacites: ["AR6"], intensite: "franche", role: "agir" }),
        contenu("doux", { capacites: ["AR6"], intensite: "douce", format: "lire" }),
      ],
      pratiques: [],
    };
    expect(choisirContenu(cat, s3, profil).contenu?.id).toBe("franc");
    expect(choisirContenu(cat, s3, { ...profil, douceur: true }).contenu?.id).toBe("doux");
  });

  it("est stable : mêmes entrées, même choix", () => {
    const cat: Catalogue = {
      contenus: [contenu("x", { capacites: ["AR3"] }), contenu("y", { capacites: ["AR3"] })],
      pratiques: [],
    };
    expect(choisirContenu(cat, s1, profil).contenu?.id).toBe(choisirContenu(cat, s1, profil).contenu?.id);
  });
});

describe("le choix de l'exercice et de l'acte", () => {
  const cat: Catalogue = {
    contenus: [],
    pratiques: [
      pratique("ouvrir-ar3", { capacites: ["AR3"], role: "ouvrir" }),
      pratique("agir-ar3", { capacites: ["AR3"], role: "agir", formeReponse: "Acte réel puis retour" }),
      pratique("agir-ar6", { capacites: ["AR6"], role: "agir", formeReponse: "Acte réel puis retour" }),
    ],
  };

  it("semaine 1 : rôle « ouvrir », capacité 1", () => {
    expect(choisirPratique(cat, s1, profil).pratique?.id).toBe("ouvrir-ar3");
  });

  it("semaine 3 : rôle « agir », capacité 2", () => {
    expect(choisirPratique(cat, s3, profil).pratique?.id).toBe("agir-ar6");
  });

  it("jamais un exercice qui touche un sujet à éviter", () => {
    const c: Catalogue = { contenus: [], pratiques: [pratique("p", { capacites: ["AR3"], consigne: "Parle à ta mère de l'argent." })] };
    expect(choisirPratique(c, s1, { ...profil, sujetsAEviter: "maternité" }).pratique).toBeNull();
  });
});

describe("ses avis comptent pour la suite", () => {
  const cat = (): Catalogue => ({
    contenus: [
      contenu("insaff-2", { auteur: "Ma juste valeur, Insaff El Hassini", capacites: ["AR3"], role: "ouvrir" }),
      contenu("autre", { auteur: "Toutes puissantes", capacites: ["AR3"], role: "ouvrir", format: "lire" }),
    ],
    pratiques: [],
  });
  const avis = (retour: "parle" | "moyen" | "pas_maintenant" | "pas_pour_moi", mot = "") => [
    { retour, auteur: "Ma juste valeur, Insaff El Hassini", registre: null, format: "ecouter" as const, mot },
  ];

  it("sans avis, on choisit l'autrice qui correspond le mieux", () => {
    expect(choisirContenu(cat(), s1, profil).contenu?.id).toBe("insaff-2");
  });
  it("« je n'accroche pas avec cette autrice » : ses contenus ne sont plus proposés", () => {
    const p = { ...profil, avis: avis("moyen", "Je n'accroche pas avec cette autrice.") };
    expect(choisirContenu(cat(), s1, p).contenu?.id).toBe("autre");
    // Même s'il ne restait qu'elle : on ne la repropose pas.
    const seule: Catalogue = { contenus: [cat().contenus[0]], pratiques: [] };
    expect(choisirContenu(seule, s1, p).contenu).toBeNull();
  });
  it("« moyen » est un signal faible, « pas pour moi » un signal fort, « ça m'a parlé » rapproche", () => {
    expect(choisirContenu(cat(), s1, { ...profil, avis: avis("moyen") }).contenu?.id).toBe("insaff-2");
    expect(choisirContenu(cat(), s1, { ...profil, avis: avis("pas_pour_moi") }).contenu?.id).toBe("autre");
    expect(choisirContenu(cat(), s1, { ...profil, avis: avis("parle") }).contenu?.id).toBe("insaff-2");
  });
  it("« pas maintenant » n'écarte personne", () => {
    expect(choisirContenu(cat(), s1, { ...profil, avis: avis("pas_maintenant") }).contenu?.id).toBe("insaff-2");
  });
});

describe("« pas mal »", () => {
  it("rapproche un peu, moins que « ça m'a parlé »", () => {
    const cat: Catalogue = {
      contenus: [
        contenu("a", { auteur: "Autrice A", capacites: ["AR3"], role: "ouvrir", format: "lire" }),
        contenu("b", { auteur: "Autrice B", capacites: ["AR3"], role: "ouvrir", format: "lire" }),
      ],
      pratiques: [],
    };
    const avis = (retour: "pas_mal" | "moyen") => [{ retour, auteur: "Autrice B", registre: null, format: null, mot: "" }];
    expect(choisirContenu(cat, s1, profil).contenu?.id).toBe("a");
    expect(choisirContenu(cat, s1, { ...profil, avis: avis("pas_mal") }).contenu?.id).toBe("b");
    expect(choisirContenu(cat, s1, { ...profil, avis: avis("moyen") }).contenu?.id).toBe("a");
  });
});
