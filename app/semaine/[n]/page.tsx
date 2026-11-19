import { notFound, redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { racinesAEviter, toucheSujet } from "@/lib/catalogue/filtres";
import { apercuDuLien } from "@/lib/catalogue/apercu";
import { choixDuMois, profilDeChoix } from "@/lib/catalogue/semaines";
import { chargerChemin } from "@/lib/chemin/donnees";
import { carteEcrite, chargerTextesCarte, texte as texteCarte } from "@/lib/moteur/carte";
import { sesReponses } from "@/lib/moteur/ecriture";
import { planDuMonde } from "@/lib/moteur/prompts";
import { MONDE, QUETE, libelleCapacite, type CodeCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { extraitExact } from "@/lib/rituel/echo";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { CARNETS, EPISODES, avantEpisodeDeSecours, remplir } from "@/lib/semaines/contenu";
import { dansLeMois, moisDe } from "@/lib/semaines/etiquettes";
import { ficheDeLEpisode } from "@/lib/semaines/fiche";
import { texteDeSemaine } from "@/lib/semaines/textes";
import { createClient } from "@/lib/supabase/server";
import { SemaineMonde } from "./SemaineMonde";
import { SemaineQuete } from "./SemaineQuete";

export const metadata = { title: "Ta semaine · Présente !" };
// Les textes de la semaine s'écrivent à l'ouverture : on laisse du temps au moteur.
export const maxDuration = 180;

const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const court = (t: string | undefined | null, max = 120) => {
  const x = extraitExact(t ?? "");
  return x && x.length <= max ? x.replace(/[.\s]+$/, "") : undefined;
};

export default async function Semaine({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 12) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (n > chemin.semaine) redirect("/chemin");

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
  const finie = n < chemin.semaine;
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

  const commun = {
    n,
    etape: finie ? 9 : etape,
    finie,
    titreQuete: QUETE[quete].nom,
    initiales,
  };

  // -------------------------------------------------------------------------
  // Semaines 1 et 3 : la quête
  // -------------------------------------------------------------------------
  if (d === 1 || d === 3) {
    const choix = await choixDuMois(supabase, chemin, mois, profilDeChoix(profil, reponses));
    const s = d === 1 ? choix.s1 : choix.s3;
    const brut = s.contenu;
    const apercu = brut && (!brut.image || !brut.description) ? await apercuDuLien(brut.lien) : null;
    const contenu = brut
      ? { ...brut, image: brut.image ?? apercu?.image ?? null, description: brut.description ?? apercu?.description ?? null }
      : null;
    const pratique = s.pratique;
    const capacite = capaciteDite(caps[d === 1 ? 0 : 1]);

    // La question avant, avec ses mots de la semaine 1 quand c'est la semaine 3.
    const carnetQ = CARNETS[quete][d === 1 ? "s1" : "s3"];
    const s1 = Object.fromEntries(carnet.filter((e) => e.semaine === n - 2).map((e) => [e.code, e.reponse]));
    const source = (c?: "avant" | "apres2") => (c === "avant" ? s1[`s${n - 2}:avant`] : c === "apres2" ? s1[`s${n - 2}:carnet:2`] : undefined);
    const questionAvant = remplir(carnetQ, {
      scene: sur(court(source(CARNETS[quete].sources.scene), 90)),
      personne: sur(court(source(CARNETS[quete].sources.personne), 40)),
      capacite,
    });

    const avantTexte = await texteDeSemaine(supabase, {
      userId: user.id,
      pathId: chemin.id,
      cle: `s${n}`,
      emplacement: "avant_contenu",
      entree: {
        semaine: n,
        quete: QUETE[quete].nom,
        capacite,
        contenu: contenu ? { titre: contenu.titre, auteur: contenu.auteur, type: contenu.type, resume: contenu.description, pourquoi: contenu.pourquoi } : null,
        reponses_utiles: reponsesUtiles,
      },
      sources,
      sujetsAEviter: sujets,
      // La capacité n'est pas entre guillemets : seuls ses mots à elle le sont.
      secours: sesMotsDeLaQuete && sur(sesMotsDeLaQuete)
        ? `Tu as écrit « ${sesMotsDeLaQuete} ». Ce contenu a été choisi pour ce que tu travailles ce mois-ci : ${minuscule(capacite)}. Pendant qu'il passe, garde une question en tête : d'où vient cette phrase ?`
        : `Ce contenu a été choisi pour ce que tu travailles ce mois-ci : ${minuscule(capacite)}. Pendant qu'il passe, garde une question en tête : qu'est-ce qui te ressemble, là-dedans ?`,
    });
    if ("detresse" in avantTexte) redirect("/quand-ca-ne-va-pas");

    // L'introduction de l'exercice ou de l'acte : écrite une fois le carnet rempli, à partir de ce qu'elle vient d'écrire.
    let intro: string | null = null;
    if (pratique && (finie || etape >= 3)) {
      const adapter = sur(court(decetteSemaine.find((e) => e.code === `s${n}:carnet:2`)?.reponse, 110));
      const r = await texteDeSemaine(supabase, {
        userId: user.id,
        pathId: chemin.id,
        cle: `s${n}:intro`,
        emplacement: d === 1 ? "intro_exercice" : "intro_acte",
        entree: {
          semaine: n,
          quete: QUETE[quete].nom,
          capacite,
          [d === 1 ? "exercice" : "acte"]: { nom: pratique.nom, en_bref: pratique.enBref, consigne: pratique.consigne, rythme: pratique.rythme },
          carnet_de_cette_semaine: decetteSemaine.filter((e) => e.reponse.trim()).map((e) => ({ question: e.question, reponse: e.reponse })),
          reponses_utiles: reponsesUtiles,
        },
        sources,
        sujetsAEviter: sujets,
        secours: adapter
          ? d === 1
            ? `Tu as noté : « ${adapter} ». Pars de là. Il n'y a pas de bonne réponse, seulement la tienne.`
            : `Tu as parlé de « ${adapter} » : c'est peut-être le bon endroit pour essayer, à ta mesure.`
          : d === 1
            ? "Prends-le à ton rythme. Il n'y a pas de bonne réponse, seulement la tienne."
            : "Choisis un endroit où tu ne risques pas grand-chose : un petit geste compte autant qu'un grand.",
      });
      if ("detresse" in r) redirect("/quand-ca-ne-va-pas");
      intro = r.texte;
    }

    return (
      <>
        <BarreEspace courante="chemin" />
        <SemaineQuete
          {...commun}
          dansLeMois={d}
          avantTexte={avantTexte.texte}
          questionAvant={questionAvant}
          questionAvantLigne={Boolean(carnetQ.avantLigne)}
          apres={carnetQ.apres}
          contenu={
            contenu
              ? {
                  titre: contenu.titre,
                  auteur: contenu.auteur,
                  type: contenu.type,
                  temps: contenu.temps,
                  entreeCourte: contenu.entreeCourte,
                  format: contenu.format,
                  lien: contenu.lien,
                  image: contenu.image,
                  description: contenu.description,
                }
              : null
          }
          catalogueIndisponible={choix.catalogueIndisponible}
          pratique={
            pratique
              ? {
                  nom: pratique.nom,
                  enBref: pratique.enBref,
                  consigne: pratique.consigne,
                  regles: pratique.regles,
                  pourquoi: pratique.pourquoiCaCompte,
                  rythme: pratique.rythme,
                  forme: pratique.formeReponse,
                }
              : null
          }
          intro={intro}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Semaines 2 et 4 : le monde
  // -------------------------------------------------------------------------
  const ep = EPISODES[monde][d === 2 ? 0 : 1];
  const personne = sur(court(carnet.find((e) => e.semaine === mois * 4 + 1 && /:avant$|:carnet:2$/.test(e.code))?.reponse, 40));
  const avantTexte = await texteDeSemaine(supabase, {
    userId: user.id,
    pathId: chemin.id,
    cle: `s${n}`,
    emplacement: "avant_episode",
    entree: {
      semaine: n,
      quete: QUETE[quete].nom,
      monde: MONDE[monde].nomComplet,
      episode: { titre: ep.titre, plan: planDuMonde(monde) },
      reponses_utiles: reponsesUtiles,
    },
    sources,
    sujetsAEviter: sujets,
    secours: avantEpisodeDeSecours(ep, quete, { sesMots: sur(sesMotsDeLaQuete), personne }),
  });
  if ("detresse" in avantTexte) redirect("/quand-ca-ne-va-pas");

  // Semaine 4 : le palier, une fois l'épisode et ses questions faits.
  let palier: { texte: string; mots: string[]; prochain: { quete: string; monde: string } | null } | null = null;
  if (d === 4 && (finie || etape >= 3)) {
    const duMois = carnet.filter((e) => e.semaine > mois * 4 && e.semaine <= n && e.reponse.trim());
    const mots = duMois
      .filter((e) => /:carnet:2$|:adapter:|:exo:|:acte:1$/.test(e.code))
      .map((e) => sur(court(e.reponse, 110)))
      .filter((m): m is string => Boolean(m))
      .slice(0, 3);
    const r = await texteDeSemaine(supabase, {
      userId: user.id,
      pathId: chemin.id,
      cle: `s${n}:palier`,
      emplacement: "palier",
      entree: {
        mois: mois + 1,
        quete: QUETE[quete].nom,
        ce_qu_elle_a_ecrit_ce_mois: duMois.map((e) => ({ semaine: e.semaine, question: e.question, reponse: e.reponse })),
      },
      sources,
      sujetsAEviter: sujets,
      secours: `Un mois sur ${QUETE[quete].nom.toLowerCase()}. Relis ce que tu as écrit : qu'est-ce qui te surprend, aujourd'hui ?`,
    });
    if ("detresse" in r) redirect("/quand-ca-ne-va-pas");
    palier = {
      texte: r.texte,
      mots,
      prochain: mois < 2 ? { quete: QUETE[chemin.quetes[mois + 1]].nom, monde: MONDE[chemin.mondes[mois + 1]].nom } : null,
    };
  }

  return (
    <>
      <BarreEspace courante="chemin" />
      <SemaineMonde
        {...commun}
        dansLeMois={d}
        monde={MONDE[monde].nomComplet}
        mondeCourt={MONDE[monde].nom}
        numeroEpisode={d === 2 ? 1 : 2}
        avantTexte={avantTexte.texte}
        episode={ep}
        questionQuete={ep.questionQuete[quete] ?? null}
        fiche={ficheDeLEpisode(planDuMonde(monde), d === 2 ? 1 : 2)}
        palier={palier}
      />
    </>
  );
}
