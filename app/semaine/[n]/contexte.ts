import "server-only";
import { notFound, redirect } from "next/navigation";
import { racinesAEviter, toucheSujet } from "@/lib/catalogue/filtres";
import { choixDuMois, profilDeChoix, retoursDuCarnet } from "@/lib/catalogue/semaines";
import { jourAParis, plusJours } from "@/lib/rituel/citations";
import { chargerHumeurs } from "@/lib/rituel/donnees";
import { troisJoursLourds } from "@/lib/rituel/humeurs";
import { chargerChemin, noterDebut, suivreLeCalendrier } from "@/lib/chemin/donnees";
import { carteEcrite, chargerTextesCarte, texte as texteCarte } from "@/lib/moteur/carte";
import { sesReponses } from "@/lib/moteur/ecriture";
import { QUETE, libelleCapacite, type CodeCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { extraitExact } from "@/lib/rituel/echo";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { semaineFaite } from "@/lib/semaines/calendrier";
import { dansLeMois, moisDe } from "@/lib/semaines/etiquettes";
import { texteDeSemaine } from "@/lib/semaines/textes";
import { createClient } from "@/lib/supabase/server";

/**
 * Ce que la page d'une semaine, la page de son exercice et l'action « Vers ton exercice »
 * ont en commun : la session, le chemin, le carnet, et ce qu'elle a écrit.
 */

export const court = (t: string | undefined | null, max = 120) => {
  const x = extraitExact(t ?? "");
  return x && x.length <= max ? x.replace(/[.\s]+$/, "") : undefined;
};

export async function contexteSemaine(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 12) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  await suivreLeCalendrier(supabase, chemin);
  if (n > chemin.semaine) redirect("/chemin"); // pas encore arrivée
  await noterDebut(supabase, chemin, n);

  const [{ data: profil }, reponses, carnet, textesCarte] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    chargerReponses(supabase, 1),
    chargerCarnet(supabase),
    chargerTextesCarte(supabase, chemin.id),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  if (!carteEcrite(textesCarte, chemin)) redirect("/carte/trace");

  const mois = moisDe(n);
  const d = dansLeMois(n);
  const quete = chemin.quetes[mois];
  const monde = chemin.mondes[mois];
  const sujets: string | null = profil?.sujets_a_eviter ?? null;
  const aEviter = racinesAEviter(sujets);
  const finie = semaineFaite(n, chemin.progression);
  const etape = chemin.progression[String(n)] ?? 0;
  const capaciteDite = (c: CodeCapacite) => texteCarte(textesCarte, "capacite", c) ?? libelleCapacite(c);
  const caps = chemin.capacites[quete];

  // Ce qu'elle a écrit : le questionnaire, puis le carnet des semaines précédentes et de celle-ci.
  const questionnaire = sesReponses(reponses);
  const avant = carnet.filter((e) => e.semaine < n && e.reponse.trim()).slice(0, 24);
  const decetteSemaine = carnet.filter((e) => e.semaine === n);
  const reponsesUtiles = [
    ...questionnaire,
    ...avant.map((e) => ({ question: `Semaine ${e.semaine} : ${e.question}`, reponse: e.reponse })),
  ];
  const sources = [...questionnaire.map((r) => r.reponse), ...carnet.map((e) => e.reponse).filter(Boolean)];
  const initiales = Object.fromEntries(decetteSemaine.map((e) => [e.code, { reponse: e.reponse, retour: e.retour }]));
  const sesMotsDeLaQuete = court(reponses[3].zoom[quete]?.autrement);
  const sur = (t: string | undefined) => (t && !toucheSujet(aEviter, t) ? t : undefined);

  return {
    n,
    supabase,
    user,
    chemin,
    profil,
    reponses,
    carnet,
    mois,
    d,
    quete,
    monde,
    sujets,
    finie,
    etape,
    capaciteDite,
    caps,
    decetteSemaine,
    reponsesUtiles,
    sources,
    initiales,
    sesMotsDeLaQuete,
    sur,
  };
}

export type ContexteSemaine = Awaited<ReturnType<typeof contexteSemaine>>;

/** Semaines 1 et 3 : le contenu et la pratique choisis pour elle. */
export async function queteDeLaSemaine(ctx: ContexteSemaine) {
  // Le même profil que dans Mon chemin (jours lourds, avis), pour que le choix soit le même des deux côtés.
  const aujourdhui = jourAParis();
  const humeurs = await chargerHumeurs(ctx.supabase, plusJours(aujourdhui, -3));
  const lourd = troisJoursLourds(humeurs, aujourdhui);
  const choix = await choixDuMois(ctx.supabase, ctx.chemin, ctx.mois, profilDeChoix(ctx.profil, ctx.reponses, lourd, retoursDuCarnet(ctx.carnet)));
  const s = ctx.d === 1 ? choix.s1 : choix.s3;
  const capacite = ctx.capaciteDite(ctx.caps[ctx.d === 1 ? 0 : 1]);
  return { contenu: s.contenu, pratique: s.pratique, capacite, catalogueIndisponible: choix.catalogueIndisponible };
}

/**
 * L'introduction de l'exercice ou du geste : écrite une fois le carnet rempli, à partir de ce
 * qu'elle vient d'écrire. Mise de côté après la première écriture (texteDeSemaine).
 */
export async function introDeLaPratique(ctx: ContexteSemaine, q: Awaited<ReturnType<typeof queteDeLaSemaine>>): Promise<string | null> {
  const { pratique, capacite } = q;
  if (!pratique) return null;
  const { n, d } = ctx;
  const adapter = ctx.sur(court(ctx.decetteSemaine.find((e) => e.code === `s${n}:carnet:2`)?.reponse, 110));
  const r = await texteDeSemaine(ctx.supabase, {
    userId: ctx.user.id,
    pathId: ctx.chemin.id,
    cle: `s${n}:intro`,
    emplacement: d === 1 ? "intro_exercice" : "intro_acte",
    entree: {
      semaine: n,
      quete: QUETE[ctx.quete].nom,
      capacite,
      [d === 1 ? "exercice" : "acte"]: { nom: pratique.nom, en_bref: pratique.enBref, consigne: pratique.consigne, rythme: pratique.rythme },
      carnet_de_cette_semaine: ctx.decetteSemaine.filter((e) => e.reponse.trim()).map((e) => ({ question: e.question, reponse: e.reponse })),
      reponses_utiles: ctx.reponsesUtiles,
    },
    sources: ctx.sources,
    sujetsAEviter: ctx.sujets,
    secours: adapter
      ? d === 1
        ? `Tu as noté : « ${adapter} ». Pars de là. Il n'y a pas de bonne réponse, seulement la tienne.`
        : `Tu as parlé de « ${adapter} » : c'est peut-être le bon endroit pour essayer, à ta mesure.`
      : d === 1
        ? "Prends-le à ton rythme. Il n'y a pas de bonne réponse, seulement la tienne."
        : "Choisis un endroit où tu ne risques pas grand-chose : un petit geste compte autant qu'un grand.",
  });
  if ("detresse" in r) redirect("/quand-ca-ne-va-pas");
  return r.texte;
}
