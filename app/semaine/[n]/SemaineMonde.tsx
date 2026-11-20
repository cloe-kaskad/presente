"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AvecSesMots } from "@/components/AvecSesMots";
import { ChampCarnet } from "@/components/ChampCarnet";
import { EcritureEnCours } from "@/components/EcritureEnCours";
import { ChoixCarnet, CurseurCarnet, RetourCarnet } from "@/components/SaisieCarnet";
import { QUESTIONS_PALIER, type Episode, type QuestionMini } from "@/lib/semaines/contenu";
import { avancer, terminer } from "../actions";
import { Lecteur } from "./Lecteur";
import styles from "./vivre.module.css";

type Initiales = Record<string, { reponse: string; retour: string | null }>;

export function SemaineMonde({
  n,
  etape: etapeInitiale,
  finie,
  initiales,
  dansLeMois,
  monde,
  mondeCourt,
  numeroEpisode,
  avantTexte,
  episode,
  questionQuete,
  fiche,
  palier,
}: {
  n: number;
  etape: number;
  finie: boolean;
  titreQuete: string;
  initiales: Initiales;
  dansLeMois: 2 | 4;
  monde: string;
  mondeCourt: string;
  numeroEpisode: 1 | 2;
  avantTexte: string;
  episode: Episode;
  questionQuete: string | null;
  fiche: { idees: string[]; lectures: string | null };
  palier: { texte: string; mots: string[]; prochain: { quete: string; monde: string } | null } | null;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState(etapeInitiale);
  const [enCours, demarrer] = useTransition();
  const ouvrir = (e: number, recharger = false) =>
    demarrer(async () => {
      await avancer(n, e);
      setEtape(e);
      if (recharger) router.refresh();
    });
  const avecPalier = dansLeMois === 4;

  return (
    <main className={`${styles.page} ${styles.monde}`}>
      {enCours && avecPalier && etape >= 2 && !palier ? (
        <EcritureEnCours surtitre="Palier · fin du mois" titre="On relit ton mois." />
      ) : null}
      <p className={styles.fil}>
        <span className={styles.slash}>/</span> {mondeCourt} · épisode {numeroEpisode}
      </p>

      {/* 1. Avant d'écouter */}
      <section className={styles.section} aria-labelledby="avant">
        <h2 id="avant" className={styles.etiquette}>
          <span className={styles.slash}>/</span> Avant d&apos;écouter
        </h2>
        <p className={styles.avantTexte}>
          <AvecSesMots texte={avantTexte} fond="blanc" />
        </p>
        <Question n={n} q={episode.avant} prefixe="avant" type="avant" initiales={initiales} />
        {etape < 1 ? (
          <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(1)} disabled={enCours}>
            Écouter l&apos;épisode
          </button>
        ) : null}
      </section>

      {/* 2. L'épisode */}
      {etape >= 1 ? (
        <section className={styles.section} aria-label="L'épisode">
          <Lecteur cle={`s${n}`} titre={episode.titre} monde={monde} onFin={() => etape < 2 && ouvrir(2)} />
          <details className={styles.depliant}>
            <summary>La fiche de l&apos;épisode</summary>
            <ul className={styles.fiche}>
              {fiche.idees.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
            {fiche.lectures ? <p className={styles.lectures}>À lire ensuite : {fiche.lectures}</p> : null}
          </details>
          {etape < 2 ? (
            <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(2)} disabled={enCours}>
              J&apos;ai écouté
            </button>
          ) : null}
        </section>
      ) : null}

      {/* 3. Après : le mini-questionnaire */}
      {etape >= 2 ? (
        <section className={`${styles.section} ${styles.apres}`} aria-labelledby="apres">
          <h2 id="apres" className={styles.etiquette}>
            <span className={styles.slash}>/</span> Après · {episode.formeApres}
          </h2>
          {episode.apres.map((q) => (
            <Question key={q.code} n={n} q={q} prefixe={q.code === "adapter" ? "adapter" : q.code} type="mini_questionnaire" initiales={initiales} />
          ))}
          {questionQuete ? (
            <ChampCarnet semaine={n} type="mini_questionnaire" code={`s${n}:quete`} question={questionQuete} initial={initiales[`s${n}:quete`]?.reponse} />
          ) : null}
          <RetourCarnet semaine={n} code={`s${n}:retour`} initial={initiales[`s${n}:retour`]?.retour} question="Cet épisode, pour toi :" />
          {!avecPalier ? (
            !finie ? (
              <button type="button" className={`bouton bouton--grand ${styles.suite}`} onClick={() => demarrer(() => terminer(n, 3))} disabled={enCours}>
                J&apos;ai terminé
              </button>
            ) : (
              <p className={styles.faite}>Semaine faite. Tout est dans ton carnet.</p>
            )
          ) : etape < 3 ? (
            <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(3, true)} disabled={enCours}>
              Vers le palier
            </button>
          ) : null}
        </section>
      ) : null}

      {/* 4. Semaine 4 : le palier */}
      {avecPalier && etape >= 3 && palier ? (
        <section className={`${styles.section} ${styles.palier}`} aria-labelledby="palier">
          <span className={styles.etiquette}>/ Le palier</span>
          <h2 id="palier" className={styles.palierTitre}>
            Un mois de chemin.
          </h2>
          <p className={styles.palierTexte}>
            <AvecSesMots texte={palier.texte} fond="blanc" />
          </p>
          {palier.mots.length ? (
            <div className={styles.palierMots}>
              {palier.mots.map((m) => (
                <p key={m}>« {m} »</p>
              ))}
            </div>
          ) : null}
          {QUESTIONS_PALIER.map((q) => (
            <ChampCarnet
              key={q.code}
              semaine={n}
              type="palier"
              code={`s${n}:palier:${q.code}`}
              question={q.texte}
              placeholder={q.souffle}
              initial={initiales[`s${n}:palier:${q.code}`]?.reponse}
              surFond="sombre"
            />
          ))}
          <div className={styles.prochain}>
            <span className={styles.etiquette}>/ {palier.prochain ? "Le mois prochain" : "La suite"}</span>
            {palier.prochain ? (
              <>
                <span className={`titre-nom ${styles.prochainNom}`}>{palier.prochain.quete}</span>
                <span>avec le monde {palier.prochain.monde}. Le reste se dévoilera en chemin.</span>
              </>
            ) : (
              <span>Ton chemin de trois mois se termine ici. Bientôt, tu repasseras le questionnaire pour voir ce qui a bougé.</span>
            )}
            {!finie ? (
              <button type="button" className={`bouton ${styles.continuer}`} onClick={() => demarrer(() => terminer(n, 4))} disabled={enCours}>
                Continuer mon chemin
              </button>
            ) : (
              <Link href="/chemin" className={`bouton ${styles.continuer}`}>
                Revenir à mon chemin
              </Link>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}

/** Une question d'épisode : un ou plusieurs champs, chacun gardé dans le carnet. */
function Question({
  n,
  q,
  prefixe,
  type,
  initiales,
}: {
  n: number;
  q: QuestionMini;
  prefixe: string;
  type: "avant" | "mini_questionnaire";
  initiales: Initiales;
}) {
  const plusieurs = q.champs.length > 1;
  return (
    <fieldset className={styles.question}>
      <legend className={styles.questionTexte}>{q.texte}</legend>
      {q.champs.map((c, i) => {
        const code = `s${n}:${prefixe}:${i + 1}`;
        const question = plusieurs ? `${q.texte} · ${c.label}` : q.texte;
        const initial = initiales[code]?.reponse;
        if (c.type === "choix") return <ChoixCarnet key={code} semaine={n} type={type} code={code} question={question} label={c.label} options={c.options} initial={initial} />;
        if (c.type === "curseur")
          return (
            <CurseurCarnet
              key={code}
              semaine={n}
              type={type}
              code={code}
              question={question}
              label={c.label}
              gauche={c.gauche}
              droite={c.droite}
              initial={initial ? Number(initial.charAt(0)) || undefined : undefined}
            />
          );
        return (
          <ChampCarnet
            key={code}
            semaine={n}
            type={type}
            code={code}
            question={question}
            libelle={c.label}
            initial={initial}
            ligne={c.type === "annee" || ("ligne" in c && c.ligne)}
          />
        );
      })}
    </fieldset>
  );
}
