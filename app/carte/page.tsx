import Link from "next/link";
import { redirect } from "next/navigation";
import { AvecSesMots } from "@/components/AvecSesMots";
import { BarreEspace } from "@/components/BarreEspace";
import { Marque } from "@/components/Marque";
import { chargerChemin, espaceOuvert } from "@/lib/chemin/donnees";
import { prenomAffiche } from "@/lib/chemin/textes";
import { carteEcrite, chargerTextesCarte, lireSynthese, texte } from "@/lib/moteur/carte";
import {
  accrocheDeSecours,
  capaciteDeSecours,
  pourquoiDeSecours,
  pourquoiMondeDeSecours,
  syntheseDeSecours,
} from "@/lib/moteur/secours";
import { FIL_ROUGE, MONDE, QUETE } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { sesReponses } from "@/lib/moteur/ecriture";
import { garderMotsExacts } from "@/lib/moteur/regles";
import { createClient } from "@/lib/supabase/server";
import { recalculerMonChemin } from "./actions";
import m from "@/components/mouvement.module.css";
import styles from "./carte.module.css";

export const metadata = { title: "Ta carte · Présente !" };

const ETIQUETTE_MOIS = ["Mois 1 · on commence ici", "Mois 2", "Mois 3"];

const TEMPS: Record<string, string> = {
  "30min": "Environ trente minutes par semaine, comme tu nous l'as dit. Certaines semaines demandent un peu plus.",
  "1h": "Environ une heure par semaine, comme tu nous l'as dit.",
  "2h_plus": "Environ une heure par semaine, et davantage si tu en as envie.",
};

// Icônes (traits simples, aria-hidden)
const Casque = ({ taille = 13 }: { taille?: number }) => (
  <svg aria-hidden="true" width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </svg>
);
const Cadenas = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const ICONES = [
  <path key="1" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  <g key="2">
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </g>,
  <path key="3" d="M5 12h14M13 6l6 6-6 6" />,
  <path key="4" d="M5 21V4M5 4h11l-2 4 2 4H5" />,
];

export default async function Carte({ searchParams }: { searchParams: Promise<{ secours?: string }> }) {
  const { secours } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const [reponses, { data: profil }, textes] = await Promise.all([
    chargerReponses(supabase, 1),
    supabase.from("profiles").select("prenom, sujets_a_eviter, temps_par_semaine, detresse_le").maybeSingle(),
    chargerTextesCarte(supabase, chemin.id),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  // Les textes de la carte n'existent pas encore (ou le chemin a changé) : on passe par « On trace ton chemin ».
  const syntheseDeSecoursEnregistree = textes.get("carte_synthese:")?.statut === "secours";
  // Une fois son espace ouvert, la carte est une page de l'espace : on ne repasse plus par l'écran d'attente,
  // sauf si les textes n'existent pas du tout.
  const dansLEspace = espaceOuvert(chemin);
  if ((!carteEcrite(textes, chemin) || (syntheseDeSecoursEnregistree && !dansLEspace)) && !secours) redirect("/carte/trace");

  const prenom = prenomAffiche(profil?.prenom);
  const synthese = lireSynthese(textes) ?? syntheseDeSecours(chemin.quetes);
  // « Tes mots » : ceux choisis par le moteur ; sinon, ses réponses courtes, recopiées telles quelles.
  const sources = sesReponses(reponses).map((r) => r.reponse);
  const mots = synthese.mots?.length
    ? synthese.mots
    : garderMotsExacts(
        [
          ...chemin.quetes.map((q) => reponses[3].zoom[q]?.autrement ?? ""),
          reponses[4].pasEncore ?? "",
          reponses[1].q1_3 ?? "",
        ].filter((m) => m.length <= 70),
        sources,
        profil?.sujets_a_eviter,
        3,
      );
  const pourquoi = (i: 0 | 1 | 2) =>
    texte(textes, "carte_pourquoi", chemin.quetes[i]) ??
    pourquoiDeSecours(i, reponses[3].zoom[chemin.quetes[i]]?.autrement, profil?.sujets_a_eviter);
  const capacite = (c: (typeof chemin.capacites)[keyof typeof chemin.capacites][number]) =>
    texte(textes, "capacite", c) ?? capaciteDeSecours(c);
  const accroche = (i: number) => texte(textes, "monde_accroche", chemin.mondes[i]) ?? accrocheDeSecours(chemin.mondes[i]);
  const pourquoiMonde = (i: number) =>
    texte(textes, "monde_pourquoi", chemin.mondes[i]) ?? pourquoiMondeDeSecours(chemin.mondes[i]);

  const dansTroisMois = reponses[1].q1_3?.trim().replace(/[.\s]+$/, "");
  const mondeMois1 = MONDE[chemin.mondes[0]].nom;
  const semaines = [
    { verbe: "Ouvrir", texte: "Un contenu choisi pour toi, ton carnet, puis un exercice pour ouvrir la question." },
    { verbe: "Écouter", texte: `Le premier épisode de ton monde ${mondeMois1}. 25 minutes, à écouter où tu veux.` },
    { verbe: "Agir", texte: "Un deuxième contenu, puis un geste à poser dans ta vraie vie, à ta mesure." },
    { verbe: "Faire le point", texte: "Le deuxième épisode, puis le palier : on regarde ensemble ce qui a bougé." },
  ];
  const filRouge = FIL_ROUGE.filter((f) => f.code === "FR2" || f.code === "FR4");

  const Monde = ({ i }: { i: number }) => (
    <div className={styles.monde}>
      <div className={styles.mondeHaut}>
        <span className={styles.mondeEtiquette}>Ton monde du mois</span>
        <span className={styles.badgePodcast}>
          <Casque /> Podcast original Présente!
        </span>
      </div>
      <h4 className={styles.mondeNom}>{MONDE[chemin.mondes[i]].nomComplet}</h4>
      <p className={styles.mondeAccroche}>{accroche(i)}</p>
      <p className={styles.mondePourquoi}>
        <strong>Choisi pour toi parmi 6 mondes.</strong> <AvecSesMots texte={pourquoiMonde(i)} />
      </p>
    </div>
  );

  return (
    <div className={styles.page}>
      {dansLEspace ? (
        <BarreEspace courante="carte" />
      ) : (
        <header className={styles.entete}>
          <Marque couleur="rouge" />
          <Link href="/bienvenue" className={`bouton ${styles.commencerHaut}`}>
            Commencer mon chemin
          </Link>
        </header>
      )}

      {/* 1. Ce qu'on a compris de toi : une lettre, écrite pour elle */}
      <section className={styles.compris}>
        <div className={styles.gauche}>
          <p className={styles.mention}>
            <strong>Écrit pour toi, à partir de tes réponses.</strong> Toi seule peux le lire.
          </p>
          <h1 className={styles.titreCompris}>{prenom ? `${prenom}, voici ce qu'on a compris.` : "Voici ce qu'on a compris."}</h1>
          {mots.length ? (
            <div className={styles.mots}>
              <span className={styles.motsTitre}>Tes mots, qu&apos;on a gardés</span>
              {mots.map((m) => (
                <p key={m} className={styles.mot}>
                  « {m} »
                </p>
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.droite}>
          <article className={styles.lettre}>
            <p className={`${styles.ouverture} ${m.monte}`}>
              <AvecSesMots texte={synthese.ouverture} />
            </p>
            <span className={styles.filet} aria-hidden="true" />
            {[
              ["Ce qui revient", synthese.ce_qui_revient],
              ["D'où ça vient, peut-être", synthese.d_ou_ca_vient],
              ["Ce qui se joue maintenant", synthese.ce_qui_se_joue],
            ].map(([titre, t], i) => (
              // La lettre apparaît paragraphe par paragraphe (150 ms d'écart).
              <div key={titre} className={`${styles.bloc} ${m.monte}`} style={{ animationDelay: `${0.15 * (i + 1)}s` }}>
                <h2 className={styles.blocTitre}>{titre}</h2>
                <p className={styles.blocTexte}>
                  <AvecSesMots texte={t} />
                </p>
              </div>
            ))}
            <p className={`${styles.lecture} ${m.monte}`} style={{ animationDelay: "0.6s" }}>
              C&apos;est une lecture, pas un verdict. Elle s&apos;affinera avec ce que tu écriras en route.</p>
          </article>
          {dansLEspace ? null : (
            <div className={styles.appel}>
              <Link href="/bienvenue" className="bouton bouton--grand">
                Commencer mon chemin
              </Link>
              <a href="#chemin" className={styles.appelSuite}>
                Voir d&apos;abord ce qu&apos;on m&apos;a préparé
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 2. Ton chemin, mois par mois */}
      <section className={styles.chemin} id="chemin">
        <h2 className={styles.titreSection}>Ton chemin : trois quêtes, trois mondes.</h2>
        <div className={styles.explication}>
          <div>
            <span className={styles.badgeQuete}>Quête</span>
            <p className={styles.explicationTitre}>Une quête, c&apos;est ce que tu travailles dans ta vie.</p>
            <p className={styles.explicationTexte}>
              Des contenus choisis pour toi, des exercices, des gestes à poser. Tu en as trois, choisies parmi sept.
            </p>
          </div>
          <div className={styles.explicationMonde}>
            <span className={styles.badgePodcast}>
              <Casque /> Podcast original Présente!
            </span>
            <p className={styles.explicationTitre}>Un monde, c&apos;est un podcast pour comprendre d&apos;où ça vient.</p>
            <p className={styles.explicationTexte}>
              Écrit et enregistré par l&apos;équipe de Présente!. Il en existe six : on a choisi les trois qui éclairent ton histoire.
            </p>
          </div>
        </div>

        <article className={`${styles.mois} ${styles.mois1}`}>
          <div className={styles.moisQuete}>
            <div className={styles.moisHaut}>
              <span className={styles.moisEtiquette}>{ETIQUETTE_MOIS[0]}</span>
              <span className={styles.badgeContour}>Quête</span>
            </div>
            <h3 className={`titre-nom ${styles.moisNom}`}>{QUETE[chemin.quetes[0]].nom}</h3>
            <p className={styles.moisPourquoi}>
              <AvecSesMots texte={pourquoi(0)} fond="blanc" />
            </p>
            <span className={styles.apprendre}>Ce que tu vas apprendre à faire</span>
            <ul className={styles.capacites}>
              {chemin.capacites[chemin.quetes[0]].filter(Boolean).map((c) => (
                <li key={c}>
                  <span aria-hidden="true">/</span>
                  <span>{capacite(c)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Monde i={0} />
        </article>

        <div className={styles.moisSuivants}>
          {([1, 2] as const).map((i) => (
            <article key={i} className={`${styles.mois} ${styles.moisLeger}`}>
              <div className={styles.moisHaut}>
                <span className={styles.moisEtiquette}>{ETIQUETTE_MOIS[i]}</span>
                <span className={styles.badgeContour}>Quête</span>
              </div>
              <h3 className={`titre-nom ${styles.moisNom}`}>{QUETE[chemin.quetes[i]].nom}</h3>
              <p className={styles.moisPourquoi}>
                <AvecSesMots texte={pourquoi(i)} />
              </p>
              <ul className={styles.capacites}>
                {chemin.capacites[chemin.quetes[i]].filter(Boolean).map((c) => (
                  <li key={c}>
                    <span aria-hidden="true">/</span>
                    <span>{capacite(c)}</span>
                  </li>
                ))}
              </ul>
              <Monde i={i} />
            </article>
          ))}
        </div>
      </section>

      {/* 3. Ce qui t'attend, semaine après semaine */}
      <section className={styles.semaines}>
        <div className={styles.semainesIntro}>
          <h2 className={styles.titreSection}>Ton premier mois, semaine après semaine.</h2>
          <p className={styles.semainesChapo}>Ouvrir, écouter, agir, faire le point. Tout s&apos;ouvre le jour où tu commences.</p>
        </div>
        <ol className={styles.escalier}>
          {semaines.map((s, i) => (
            <li key={s.verbe} className={`${styles.semaine} ${styles[`semaine${i + 1}`]}`}>
              <div className={styles.semaineHaut}>
                <span className={`titre-nom ${styles.semaineNumero}`} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.semaineIcones}>
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICONES[i]}
                  </svg>
                  <Cadenas />
                </span>
              </div>
              <h3 className={styles.semaineTitre}>
                Semaine {i + 1} · {s.verbe}
              </h3>
              <p className={styles.semaineTexte}>{s.texte}</p>
              <span className="sr-only">Fermé jusqu&apos;au début de ton chemin.</span>
              <span className={styles.pointilles} aria-hidden="true">
                <span />
                <span />
              </span>
            </li>
          ))}
        </ol>
        <h3 className={styles.sousTitre}>Sur les trois mois</h3>
        <dl className={styles.chiffres}>
          {[
            ["6", "épisodes de podcast"],
            ["6", "contenus choisis pour toi"],
            ["3", "exercices"],
            ["3", "gestes dans ta vraie vie"],
            ["3", "paliers"],
            ["1", "carnet qui garde tout"],
          ].map(([n, l]) => (
            <div key={l} className={styles.chiffre}>
              <dt className="titre-nom">{n}</dt>
              <dd>{l}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.temps}>{TEMPS[profil?.temps_par_semaine ?? ""] ?? "Environ une heure par semaine."}</p>
      </section>

      {/* 4. Dans trois mois */}
      <section className={styles.troisMois}>
        <div>
          <h2 className={styles.titreSection}>Dans trois mois.</h2>
          {dansTroisMois ? (
            <>
              <p className={`${styles.sesMotsGrand} ${dansTroisMois.length > 140 ? styles.sesMotsMoyen : ""}`}>« {dansTroisMois} »</p>
              <p className={styles.troisMoisTexte}>
                C&apos;est ce que tu as écrit. À la fin du chemin, tu repasses le questionnaire, et on regarde ensemble ce qui a bougé.
              </p>
            </>
          ) : (
            <p className={styles.troisMoisTexte}>
              À la fin du chemin, tu repasses le questionnaire, et on regarde ensemble ce qui a bougé.
            </p>
          )}
        </div>
        <ul className={styles.mesures} aria-label="Ce qu'on mesurera">
          {filRouge.map((f) => (
            <li key={f.code}>
              <span className={styles.mesurePhrase}>{f.phrase}</span>
              <span className={styles.mesurePiste} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((k) => (
                  <span key={k} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. L'offre : seulement avant d'avoir commencé */}
      {dansLEspace ? null : (
        <>
      <section className={styles.offre}>
        <div className={styles.offreImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/carnets.jpg" alt="" />
        </div>
        <div className={styles.offreTexte}>
          <p className={styles.prix}>
            <span className="titre-nom">25&nbsp;€</span>
            <span className={styles.prixUnite}>
              par mois,
              <br />
              pendant trois mois
            </span>
          </p>
          <p className={styles.soit}>Soit 75 € pour ton chemin. Pas d&apos;abonnement, rien qui se renouvelle.</p>
          <ul className={styles.inclus}>
            {[
              "Tes 3 quêtes : contenus choisis pour toi, exercices, gestes, paliers",
              "Tes 3 mondes : 6 épisodes de podcast originaux",
              "Ton carnet, qui garde tout ce que tu écris",
              "Une carte postale à offrir à une femme de ton choix",
            ].map((l) => (
              <li key={l}>
                <span aria-hidden="true">/</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
          <Link href="/bienvenue" className={`bouton bouton--grand ${styles.commencer}`}>
            Commencer mon chemin
          </Link>
          <p className={styles.rassure}>Personne de l&apos;équipe ne lit tes réponses. Tu peux mettre ton chemin en pause quand tu veux.</p>
        </div>
      </section>

        </>
      )}

      {/* 6. Échanger une quête */}
      <section className={styles.fin}>
        <Link href="/carte/echanger">Ce n&apos;est pas tout à fait ça ? Échanger une quête.</Link>
        <form action={recalculerMonChemin}>
          <button type="submit" className={styles.discret}>
            Recalculer mon chemin (démo)
          </button>
        </form>
      </section>
      {/* Toujours à portée : la barre du bas (avant d'avoir commencé) */}
      {dansLEspace ? null : (
      <div className={styles.barreBas}>
        <span className={styles.barreTexte}>
          <strong>Ton chemin est prêt.</strong> 25 € par mois, pendant trois mois.
        </span>
        <Link href="/bienvenue" className="bouton">
          Commencer mon chemin
        </Link>
      </div>
      )}
    </div>
  );
}
