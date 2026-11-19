"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AvecSesMots } from "@/components/AvecSesMots";
import { ChampCarnet } from "@/components/ChampCarnet";
import { Mantra } from "@/components/Mantra";
import { CurseurCarnet, RetourCarnet } from "@/components/SaisieCarnet";
import { enregistrerEntree } from "@/app/carnet/actions";
import { decrireContenu } from "@/lib/catalogue/presentation";
import { QUESTIONS_ACTE, type QuestionCarnet } from "@/lib/semaines/contenu";
import { avancer, terminer } from "../actions";
import styles from "./vivre.module.css";

type Initiales = Record<string, { reponse: string; retour: string | null }>;

type Contenu = {
  titre: string;
  auteur: string;
  type: string;
  temps: "court" | "moyen" | "long" | "a_verifier" | null;
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
  intro,
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
  intro: string | null;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState(etapeInitiale);
  const [enCours, demarrer] = useTransition();
  const [decale, setDecale] = useState(Boolean(initiales[`s${n}:decale`]));
  const val = (code: string) => initiales[code]?.reponse ?? "";

  // Passe à l'étape suivante. Pour l'exercice, le serveur écrit l'introduction : on recharge la page.
  const ouvrir = (e: number, recharger = false) =>
    demarrer(async () => {
      await avancer(n, e);
      setEtape(e);
      if (recharger) router.refresh();
    });

  const agir = dansLeMois === 3;

  return (
    <main className={styles.page}>
      {enCours && etape >= 2 && !intro ? (
        <div className={styles.attente}>
          <Mantra surtitre={agir ? "/ On prépare ton geste" : "/ On prépare ton exercice"} />
        </div>
      ) : null}
      <p className={styles.fil}>
        <span className={styles.slash}>/</span> {titreQuete} · semaine {((n - 1) % 4) + 1}
      </p>

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
          {etape < 3 && pratique ? (
            <button type="button" className={`bouton ${styles.suite}`} onClick={() => ouvrir(3, true)} disabled={enCours}>
              {agir ? "Vers ton geste" : "Vers ton exercice"}
            </button>
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

      {/* 4. L'exercice, ou l'acte */}
      {etape >= 3 && pratique ? (
        <section className={`${styles.section} ${agir ? styles.acte : ""}`} aria-labelledby="pratique">
          <span className={styles.etiquette}>
            <span className={styles.slash}>/</span> {agir ? "Dans ta vraie vie, cette semaine" : `Exercice${pratique.rythme ? ` · ${pratique.rythme}` : ""}`}
          </span>
          <h2 id="pratique" className={styles.titrePratique}>
            {pratique.nom}
          </h2>
          {intro ? (
            <p className={styles.intro}>
              <AvecSesMots texte={intro} />
            </p>
          ) : null}
          {pratique.consigne ? (
            <div className={styles.consigne}>
              <span className={styles.etiquette}>
                <span className={styles.slash}>/</span> La consigne
              </span>
              <p className={agir ? styles.consigneForte : undefined}>{pratique.consigne}</p>
            </div>
          ) : pratique.enBref ? (
            <p>{pratique.enBref}</p>
          ) : null}
          {pratique.regles ? (
            <details className={styles.depliant}>
              <summary>Les règles</summary>
              <p>{pratique.regles}</p>
            </details>
          ) : null}
          {pratique.pourquoi ? (
            <details className={styles.depliant}>
              <summary>Pourquoi ça compte</summary>
              <p>{pratique.pourquoi}</p>
            </details>
          ) : null}

          {agir ? (
            <>
              <div className={styles.decaler}>
                <span>
                  {decale
                    ? "C'est décalé. Il t'attendra, sans compte à rebours : tu peux quand même terminer ta semaine."
                    : "Pas encore fait ? Tu as jusqu'à dimanche. Et si ce n'est pas le moment, tu peux le décaler."}
                </span>
                {!decale ? (
                  <button
                    type="button"
                    className={styles.decalerBouton}
                    onClick={async () => {
                      setDecale(true);
                      await enregistrerEntree({
                        semaine: n,
                        type: "acte",
                        code: `s${n}:decale`,
                        question: `${pratique.nom} : décalé`,
                        reponse: `Décalé le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
                      }).catch(() => null);
                    }}
                  >
                    Décaler
                  </button>
                ) : null}
              </div>
              <span className={styles.etiquette}>
                <span className={styles.slash}>/</span> Je l&apos;ai fait
              </span>
              {QUESTIONS_ACTE.map((q, i) => (
                <ChampCarnet
                  key={i}
                  semaine={n}
                  type="acte"
                  code={`s${n}:acte:${i + 1}`}
                  question={q.texte}
                  initial={val(`s${n}:acte:${i + 1}`)}
                />
              ))}
            </>
          ) : (
            <FormulaireExercice n={n} pratique={pratique} val={val} />
          )}
          {!finie ? (
            <button type="button" className={`bouton bouton--grand ${styles.suite}`} onClick={() => demarrer(() => terminer(n, 4))} disabled={enCours}>
              {agir ? "Garder dans mon carnet" : "J'ai terminé"}
            </button>
          ) : (
            <p className={styles.faite}>Semaine faite. Tout est dans ton carnet.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

/** Le formulaire de l'exercice, selon le champ « Forme de réponse » de la pratique. */
function FormulaireExercice({ n, pratique, val }: { n: number; pratique: Pratique; val: (code: string) => string }) {
  const forme = pratique.forme ?? "Texte libre";
  const q = (label: string) => `${pratique.nom} · ${label}`;
  if (forme === "Liste ou colonnes") {
    return (
      <div className={styles.elements}>
        {["Premier élément", "Deuxième élément", "Troisième élément"].map((l, i) => (
          <div key={l} className={styles.element}>
            <ChampCarnet semaine={n} type="exercice" code={`s${n}:exo:${i + 1}`} question={q(l)} initial={val(`s${n}:exo:${i + 1}`)} />
          </div>
        ))}
      </div>
    );
  }
  if (forme === "Curseur") {
    return (
      <>
        <CurseurCarnet semaine={n} type="exercice" code={`s${n}:exo:curseur`} question={q("Où tu en es")} label="Où tu en es" gauche="pas du tout" droite="tout à fait" />
        <ChampCarnet semaine={n} type="exercice" code={`s${n}:exo:1`} question={q("Ce que tu en dis")} initial={val(`s${n}:exo:1`)} />
      </>
    );
  }
  const note = forme === "Audio" || forme === "Photo" ? " (l'audio et la photo arriveront plus tard : écris-le ici)" : "";
  return <ChampCarnet semaine={n} type="exercice" code={`s${n}:exo:1`} question={q(`Ta réponse${note}`)} initial={val(`s${n}:exo:1`)} />;
}
