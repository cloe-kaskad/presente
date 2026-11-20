import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { apercuDuLien } from "@/lib/catalogue/apercu";
import { planDuMonde } from "@/lib/moteur/prompts";
import { MONDE, QUETE } from "@/lib/questionnaire/contenu";
import { CARNETS, EPISODES, avantEpisodeDeSecours, questionsApres, remplir, versionLongue } from "@/lib/semaines/contenu";
import { etatExercice, joursDuRythme, jourEnCours, estCodeJour, jourDuCode } from "@/lib/semaines/exercice";
import { ficheDeLEpisode } from "@/lib/semaines/fiche";
import { texteDeSemaine } from "@/lib/semaines/textes";
import { CITATIONS, jourAParis, numeroDuJour } from "@/lib/rituel/citations";
import { contexteSemaine, court, queteDeLaSemaine } from "./contexte";
import { SemaineMonde } from "./SemaineMonde";
import { SemaineQuete } from "./SemaineQuete";

export const metadata = { title: "Ta semaine · Présente !" };
// Les textes de la semaine s'écrivent à l'ouverture : on laisse du temps au moteur.
export const maxDuration = 180;

const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export default async function Semaine({ params }: { params: Promise<{ n: string }> }) {
  const ctx = await contexteSemaine(Number((await params).n));
  const { n, supabase, user, chemin, carnet, mois, d, quete, monde, sujets, finie, etape, decetteSemaine, reponsesUtiles, sources, initiales, sesMotsDeLaQuete, sur } = ctx;

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
    const q = await queteDeLaSemaine(ctx);
    const { pratique, capacite } = q;
    const brut = q.contenu;
    const apercu = brut && (!brut.image || !brut.description) ? await apercuDuLien(brut.lien) : null;
    const contenu = brut
      ? { ...brut, image: brut.image ?? apercu?.image ?? null, description: brut.description ?? apercu?.description ?? null }
      : null;

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

    // L'exercice, une fois créé : son nom, son état et où elle en est (bloc en haut de la page du contenu).
    const etat = pratique ? etatExercice({ n, progression: chemin.progression, semaineCourante: chemin.semaine, entrees: decetteSemaine }) : null;
    const total = pratique && d === 1 ? joursDuRythme(pratique.rythme) : null;
    const joursNotes = decetteSemaine.filter((e) => estCodeJour(n, e.code) && e.reponse.trim()).map((e) => jourDuCode(e.code));
    const exercice =
      pratique && etat
        ? {
            nom: pratique.nom,
            etat,
            ou:
              etat === "termine"
                ? "terminé"
                : etat === "pas_commence"
                  ? "pas commencé"
                  : total
                    ? `en cours, jour ${jourEnCours(total, joursNotes, jourAParis())} sur ${total}`
                    : "en cours",
          }
        : null;

    return (
      <>
        <BarreEspace courante="chemin" />
        <SemaineQuete
          {...commun}
          dansLeMois={d}
          avantTexte={avantTexte.texte}
          questionAvant={questionAvant}
          questionAvantLigne={Boolean(carnetQ.avantLigne)}
          apres={questionsApres(contenu?.format, versionLongue(contenu?.intensite, mois))}
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
          catalogueIndisponible={q.catalogueIndisponible}
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
          exercice={exercice}
          citation={CITATIONS[(numeroDuJour(jourAParis()) + n * 3 + 1) % CITATIONS.length]}
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
