import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheminEnregistre, ChoixEnregistre } from "@/lib/chemin/donnees";
import { QUESTIONS_OUVERTES, type FormatId, type TempsId } from "@/lib/questionnaire/contenu";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { chargerCatalogue } from "./airtable";
import { choisirContenu, choisirPratique, type AvisContenu, type ProfilChoix, type RetourId } from "./choix";
import type { Contenu, Pratique } from "./types";

export type SemaineDeQuete = {
  cle: string; // « m1s1 »
  contenu: Contenu | null;
  pratique: Pratique | null;
};

export type ChoixDuMois = { s1: SemaineDeQuete; s3: SemaineDeQuete; catalogueIndisponible: boolean };

type Profil = {
  temps_par_semaine: string | null;
  formats_preferes: string[] | null;
  sujets_a_eviter: string | null;
};

/** Son avis sur le contenu d'une semaine (« Ce contenu, pour toi ? ») et son mot libre, tels que rangés dans son carnet. */
export type RetourDeSemaine = { semaine: number; retour: RetourId; mot: string };

/** Ses avis, lus dans son carnet (entrées « s{n}:retour »). */
export function retoursDuCarnet(entrees: { semaine: number; code: string; retour: string | null; reponse: string }[]): RetourDeSemaine[] {
  return entrees
    .filter((e) => e.code === `s${e.semaine}:retour` && e.retour)
    .map((e) => ({ semaine: e.semaine, retour: e.retour as RetourId, mot: e.reponse ?? "" }));
}

export type ProfilAvecRetours = ProfilChoix & { retours?: RetourDeSemaine[] };

export function profilDeChoix(profil: Profil | null, reponses: Reponses, douceur = false, retours: RetourDeSemaine[] = []): ProfilAvecRetours {
  const mots = [
    ...QUESTIONS_OUVERTES.map((q) => reponses[1][q.id] ?? ""),
    reponses[2].appelle ?? "",
    ...Object.values(reponses[3].zoom).map((z) => z?.autrement ?? ""),
    reponses[4].pasEncore ?? "",
  ].join("\n");
  return {
    temps: (profil?.temps_par_semaine ?? undefined) as TempsId | undefined,
    formats: (profil?.formats_preferes ?? []) as FormatId[],
    sujetsAEviter: profil?.sujets_a_eviter,
    sesMots: mots,
    douceur,
    retours,
  };
}

function idsDejaPris(choix: Record<string, ChoixEnregistre>, sauf: string[]): string[] {
  return Object.entries(choix)
    .filter(([cle]) => !sauf.includes(cle))
    .flatMap(([, c]) => [c.contenu, c.pratique])
    .filter((x): x is string => Boolean(x));
}

/**
 * Le contenu et l'exercice des semaines 1 et 3 d'un mois.
 * Choisis une fois, puis enregistrés dans son chemin : ils ne changent plus à chaque visite.
 * On choisit à nouveau seulement si la quête du mois a changé (échange) ou si un élément
 * n'est plus validé dans Airtable.
 */
export async function choixDuMois(
  supabase: SupabaseClient,
  chemin: CheminEnregistre,
  mois: 0 | 1 | 2,
  profilBrut: ProfilAvecRetours,
): Promise<ChoixDuMois> {
  const { catalogue, erreur } = await chargerCatalogue();
  const quete = chemin.quetes[mois];
  const cles = [`m${mois + 1}s1`, `m${mois + 1}s3`] as const;
  const parId = {
    contenus: new Map(catalogue.contenus.map((c) => [c.id, c])),
    pratiques: new Map(catalogue.pratiques.map((p) => [p.id, p])),
  };

  // Ses avis sur les contenus déjà proposés : chaque semaine retrouve son contenu par le choix enregistré.
  const contenuDeLaSemaine = (n: number) => {
    const d = ((n - 1) % 4) + 1;
    const id = chemin.choix[`m${Math.floor((n - 1) / 4) + 1}s${d}`]?.contenu;
    return id ? parId.contenus.get(id) : undefined;
  };
  const retours = profilBrut.retours ?? [];
  const avis: AvisContenu[] = retours.flatMap((r) => {
    const c = contenuDeLaSemaine(r.semaine);
    return c ? [{ retour: r.retour, auteur: c.auteur, registre: c.registre, format: c.format, mot: r.mot }] : [];
  });
  const profil: ProfilChoix = { ...profilBrut, avis };
  // « Pas maintenant » : ce contenu pourra revenir plus tard, à partir du mois suivant.
  const aReproposer = new Set(
    retours
      .filter((r) => r.retour === "pas_maintenant" && Math.floor((r.semaine - 1) / 4) < mois)
      .map((r) => contenuDeLaSemaine(r.semaine)?.id)
      .filter((x): x is string => Boolean(x)),
  );

  const encoreBon = (c: ChoixEnregistre | undefined) =>
    c &&
    c.quete === quete &&
    c.contenu &&
    c.pratique &&
    parId.contenus.has(c.contenu) &&
    parId.pratiques.has(c.pratique);

  const nouveaux: Record<string, ChoixEnregistre> = {};
  let precedent: Contenu | null = null;

  for (const [i, cle] of cles.entries()) {
    const deja = chemin.choix[cle];
    // La semaine 3 se choisit à nouveau tant qu'elle n'est pas ouverte : l'avis de la semaine 1 compte déjà.
    const n = mois * 4 + (i === 0 ? 1 : 3);
    const ouverte = (chemin.progression[String(n)] ?? 0) > 0 || n < chemin.semaine;
    if (encoreBon(deja) && (i === 0 || ouverte || erreur)) {
      precedent = parId.contenus.get(deja!.contenu!) ?? null;
      continue;
    }
    if (erreur) continue;
    const demande = {
      quete,
      semaine: (i === 0 ? 1 : 3) as 1 | 3,
      capacites: chemin.capacites[quete] as [string, string],
      dejaPris: [...idsDejaPris(chemin.choix, [cle]), ...idsDejaPris(nouveaux, [])].filter((id) => !aReproposer.has(id)),
      precedent,
    };
    const c = choisirContenu(catalogue, demande, profil);
    const p = choisirPratique(catalogue, demande, profil);
    const memeChose = deja && deja.quete === quete && deja.contenu === (c.contenu?.id ?? null) && deja.pratique === (p.pratique?.id ?? null);
    if (memeChose) {
      precedent = c.contenu;
      continue;
    }
    nouveaux[cle] = {
      quete,
      contenu: c.contenu?.id ?? null,
      pratique: p.pratique?.id ?? null,
      capaciteContenu: c.capacite,
      capacitePratique: p.capacite,
    };
    precedent = c.contenu;
  }

  if (Object.keys(nouveaux).length) {
    const choix = { ...chemin.choix, ...nouveaux };
    const { error } = await supabase.from("paths").update({ choix }).eq("id", chemin.id);
    if (error) console.error("[choix] non enregistré :", error.code);
    else chemin.choix = choix;
  }

  const semaine = (cle: string): SemaineDeQuete => {
    const c = { ...chemin.choix, ...nouveaux }[cle];
    return {
      cle,
      contenu: c?.contenu ? (parId.contenus.get(c.contenu) ?? null) : null,
      pratique: c?.pratique ? (parId.pratiques.get(c.pratique) ?? null) : null,
    };
  };

  return { s1: semaine(cles[0]), s3: semaine(cles[1]), catalogueIndisponible: erreur };
}
