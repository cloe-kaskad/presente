"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AvecSesMots } from "@/components/AvecSesMots";
import { ChampCarnet } from "@/components/ChampCarnet";
import { EcritureEnCours } from "@/components/EcritureEnCours";
import { RetourCarnet } from "@/components/SaisieCarnet";
import { decrireContenu } from "@/lib/catalogue/presentation";
import type { QuestionCarnet } from "@/lib/semaines/contenu";
import type { EtatExercice } from "@/lib/semaines/exercice";
import { avancer, preparerExercice, terminer } from "../actions";
import styles from "./vivre.module.css";

type Initiales = Record<string, { reponse: string; retour: string | null }>;

type Contenu = {
  titre: string;
  auteur: string;
  type: string;
  temps: "court" | "moyen" | "long" | "a_verifier" | "trop_court" | null;
  entreeCourte: string | null;
  format: string | null;
  lien: string | null;
  image: string | null;
  description: string | null;
};

type Pratique = {
  nom: string;
  enBref: string | null;
  consigne: string | null;
  regles: string | null;
  pourquoi: string | null;
  rythme: string | null;
  forme: string | null;
};

type Exercice = { nom: string; etat: EtatExercice; ou: string };

const ACTION: Record<EtatExercice, string> = { pas_commence: "Commencer", en_cours: "Reprendre", termine: "Relire" };

const VERBE: Record<string, string> = { ecouter: "Écouter", lire: "Lire", regarder: "Regarder", faire: "Découvrir" };
const APRES_CONTENU: Record<string, string> = {
  ecouter: "Je l'ai écouté",
  lire: "Je l'ai lu",
  regarder: "Je l'ai regardé",
};

export function SemaineQuete({
  n,
  etape: etapeInitiale,
  finie,
  titreQuete,
  initiales,
  dansLeMois,
  avantTexte,
  questionAvant,
  questionAvantLigne,
  apres,
  contenu,
  catalogueIndisponible,
  pratique,
  exercice,
}: {
  n: number;
  etape: number;
  finie: boolean;
  titreQuete: string;
  initiales: Initiales;
  dansLeMois: 1 | 3;
  avantTexte: string;
  questionAvant: string;
  questionAvantLigne: boolean;
  apres: QuestionCarnet[];
  contenu: Contenu | null;
  catalogueIndisponible: boolean;
  pratique: Pratique | null;
  exercice: Exercice | null;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState(etapeInitiale);
  const [enCours, demarrer] = useTransition();
  const [ecriture, setEcriture] = useState(false);
  const val = (code: string) => initiales[code]?.reponse ?? "";

  // Passe à l'étape suivante.
  const ouvrir = (e: number) =>
    demarrer(async () => {
      await avancer(n, e);
      setEtape(e);
    });

  const agir = dansLeMois === 3;
  const versExercice = `/semaine/${n}/exercice`;

  // « Vers ton exercice » : on crée l'exercice (le moteur écrit son introduction), puis on ouvre sa page.
  const creerExercice = () => {
    setEcriture(true);
    demarrer(async () => {
      const r = await preparerExercice(n).catch(() => ({ ok: false }));
      if (r.ok) router.push(versExercice);
      else setEcriture(false);
    });
  };

  return (
    <main className={styles.page}>
      {ecriture ? (
        <EcritureEnCours
          surtitre={agir ? "Dans ta vraie vie, cette semaine" : `Exercice${pratique?.rythme ? ` · ${pratique.rythme.toLowerCase()}` : ""}`}
          titre={agir ? "On écrit ton geste." : "On écrit ton exercice."}
        />
      ) : null}
      <div className={styles.filHaut}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.filQuete}>
          {titreQuete} · semaine {((n - 1) % 4) + 1}
        </span>
      </div>

      {/* L'exercice, une fois créé : un bloc court, tout en haut */}
      {exercice ? (
        <Link href={versExercice} className={styles.blocExercice}>
          <span className={styles.blocExerciceTexte}>
            <strong>
              {agir ? "Ton geste" : "Ton exercice"} : {exercice.nom}
            </strong>
            <br />
            {exercice.ou}
          </span>
          <span className={styles.blocExerciceAction}>{ACTION[exercice.etat]} →</span>
        </Link>
      ) : null}

      {/* 1. Avant */}
      <section className={styles.section} aria-labelledby="avant">
        <h2 id="avant" className={styles.etiquette}>
          <span className={styles.slash}>/</span> Avant {contenu?.format === "lire" ? "de lire" : contenu?.format === "regarder" ? "de regarder" : "d'écouter"}
        </h2>
        <p className={styles.avantTexte}>
          <AvecSesMots texte={avantTexte} />
        </p>
        <ChampCarnet semaine={n} type="avant" code={`s${n}:avant`} question={questionAvant} initial={val(`s${n}:avant`)} ligne={questionAvantLigne} />
        {etape < 1 ? (
          <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(1)} disabled={enCours}>
            Continuer
          </button>
        ) : null}
      </section>

      {/* 2. Le contenu */}
      {etape >= 1 ? (
        <section className={styles.section} aria-labelledby="contenu">
          <h2 id="contenu" className="sr-only">
            Le contenu
          </h2>
          {contenu ? (
            <div className={styles.contenu}>
              {contenu.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contenu.image} alt="" className={styles.contenuImage} />
              ) : null}
              <div className={styles.contenuTexte}>
                <span className={styles.contenuType}>
                  {decrireContenu(contenu)}
                  {contenu.auteur ? ` · ${contenu.auteur}` : ""}
                </span>
                <span className={styles.contenuTitre}>{contenu.titre}</span>
                {contenu.description ? <p className={styles.contenuResume}>{contenu.description}</p> : null}
                {contenu.lien ? (
                  <a href={contenu.lien} target="_blank" rel="noopener noreferrer" className={`bouton bouton--blanc ${styles.contenuBouton}`}>
                    {VERBE[contenu.format ?? ""] ?? "Ouvrir"}
                    <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className={styles.manque}>
              {catalogueIndisponible
                ? "Le catalogue est momentanément indisponible. Réessaie dans quelques minutes."
                : "Aucun contenu validé ne correspond encore à cette semaine. Il en faut un dans Airtable pour cette quête."}
            </p>
          )}
          {etape < 2 ? (
            <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(2)} disabled={enCours}>
              {APRES_CONTENU[contenu?.format ?? ""] ?? "C'est fait"}, j&apos;ouvre mon carnet
            </button>
          ) : null}
        </section>
      ) : null}

      {/* 3. Le carnet */}
      {etape >= 2 ? (
        <section className={`${styles.section} ${styles.carnet}`} aria-labelledby="carnet">
          <div className={styles.carnetHaut}>
            <h2 id="carnet" className={styles.etiquette}>
              <span className={styles.slash}>/</span> Après · ton carnet
            </h2>
            <span className={styles.duree}>2 minutes</span>
          </div>
          {apres.map((q, i) => (
            <ChampCarnet
              key={i}
              semaine={n}
              type="carnet"
              code={`s${n}:carnet:${i + 1}`}
              question={q.texte}
              initial={val(`s${n}:carnet:${i + 1}`)}
              ligne={q.ligne}
              surFond="rose"
            />
          ))}
          <RetourCarnet semaine={n} code={`s${n}:retour`} initial={initiales[`s${n}:retour`]?.retour} />
          {pratique ? (
            exercice ? (
              <Link href={versExercice} className={`bouton ${styles.suite}`}>
                {agir ? "Vers ton geste" : "Vers ton exercice"}
              </Link>
            ) : (
              <button type="button" className={`bouton ${styles.suite}`} onClick={creerExercice} disabled={enCours}>
                {agir ? "Vers ton geste" : "Vers ton exercice"}
              </button>
            )
          ) : null}
          {!pratique && !finie ? (
            <>
              <p className={styles.manque}>
                {catalogueIndisponible
                  ? "Le catalogue est momentanément indisponible : l'exercice viendra plus tard."
                  : `Aucune pratique validée avec le rôle « ${agir ? "Agir" : "Ouvrir"} » pour cette quête dans Airtable. Tu peux quand même terminer ta semaine.`}
              </p>
              <button type="button" className={`bouton ${styles.suite}`} onClick={() => demarrer(() => terminer(n, 4))} disabled={enCours}>
                J&apos;ai terminé
              </button>
            </>
          ) : null}
        </section>
      ) : null}

    </main>
  );
}
