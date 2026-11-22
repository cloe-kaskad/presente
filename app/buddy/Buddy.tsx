"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CestNote } from "@/components/CestNote";
import m from "@/components/mouvement.module.css";
import { de, type EtatBuddy } from "@/lib/buddy/etat";
import { CE_QUE_CA_CHANGE, POINTS_BUDDY } from "@/lib/buddy/explication";
import { arreterEchange, chercherMaBuddy, rencontrer, repondreProposition, repondreQuestion } from "./actions";
import styles from "./buddy.module.css";

type Moi = { prenom: string | null; quete: string; presentation: string; montrePrenom: boolean; montreQuete: boolean };
type Autre = { prenom: string; quete: string; presentation: string; mention: string; jours: number };
type Question = { numero: number; texte: string; maReponse: string; saReponse: string | null };

/** « Un bout de chemin à deux » : se présenter, rencontrer, une question par semaine, sortir à tout moment. */
export function Buddy({ etat, moi, autre, questions, prochaine }: { etat: EtatBuddy; moi: Moi; autre: Autre; questions: Question[]; prochaine: string | null }) {
  return (
    <main className={styles.page}>
      <div className={styles.tete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.surtitre}>Un bout de chemin à deux</span>
      </div>
      {etat === "proposee" ? <Debut moi={moi} /> : null}
      {etat === "recherche" ? <Recherche quete={moi.quete} /> : null}
      {etat === "trouvee" ? <Trouvee /> : null}
      {etat === "acceptee" ? <Rencontre autre={autre} questions={questions} prochaine={prochaine} /> : null}
      {etat === "arretee" ? (
        <section className={styles.bloc}>
          <h1 className={styles.titre}>L&apos;échange s&apos;est arrêté.</h1>
          <p className={styles.texte}>Tes réponses restent dans ton carnet. Rien d&apos;autre n&apos;a jamais été partagé.</p>
          <Link href="/chemin" className="bouton">
            Retour à mon chemin
          </Link>
        </section>
      ) : null}
    </main>
  );
}

/** Écrans 2 et 3 : « Comment ça se passe », puis sa phrase avec l'aperçu de ce que l'autre verra. */
function Debut({ moi }: { moi: Moi }) {
  const router = useRouter();
  const [ecran, setEcran] = useState<"explication" | "phrase">("explication");
  const [phrase, setPhrase] = useState(moi.presentation);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState(false);

  if (ecran === "explication") {
    return (
      <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="explication">
        <h1 id="explication" className={styles.titre}>
          Un bout de chemin à deux
        </h1>
        <ul className={styles.points}>
          {POINTS_BUDDY.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className={styles.change}>{CE_QUE_CA_CHANGE}</p>
        <div className={styles.actions}>
          <button type="button" className="bouton" onClick={() => setEcran("phrase")}>
            Ça me tente
          </button>
          <form action={repondreProposition.bind(null, false)}>
            <button type="submit" className={styles.lien}>
              Pas maintenant
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="phrase">
      <h1 id="phrase" className={styles.titre}>
        Ce qui t&apos;amène ici, en une phrase.
      </h1>
      <label className={styles.champ}>
        <span className="sr-only">Ce qui t&apos;amène ici, en une phrase</span>
        <textarea value={phrase} maxLength={300} rows={3} onChange={(e) => setPhrase(e.target.value)} placeholder="Une phrase suffit." />
      </label>
      <div className={styles.apercu} aria-label="Ce qu'elle verra">
        <span className={styles.etiquette}>Ce qu&apos;elle verra</span>
        <span className={styles.apercuNom}>
          {moi.prenom ?? "Toi"}, en chemin sur {moi.quete}
        </span>
        <span className={styles.apercuPhrase}>{phrase.trim() ? `« ${phrase.trim()} »` : "Ta phrase s'affichera ici."}</span>
      </div>
      <p className={styles.petit}>C&apos;est tout ce qu&apos;elle verra de toi, avec tes réponses aux questions de la semaine.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className="bouton"
          disabled={enCours || !phrase.trim()}
          onClick={() =>
            demarrer(async () => {
              const r = await chercherMaBuddy(phrase).catch(() => ({ ok: false }));
              if (r.ok) router.refresh();
              else setErreur(true);
            })
          }
        >
          Chercher ma buddy
        </button>
        <button type="button" className={styles.lien} onClick={() => setEcran("explication")}>
          Revenir à l&apos;explication
        </button>
      </div>
      {erreur ? <p role="alert">Ce n&apos;est pas enregistré. Réessaie dans un instant.</p> : null}
    </section>
  );
}

/** Écran 4 : on ne montre personne tout de suite. */
function Recherche({ quete }: { quete: string }) {
  return (
    <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="recherche">
      <span className={styles.deuxPoints} aria-hidden="true">
        <i />
        <i />
      </span>
      <h1 id="recherche" className={styles.titre}>
        On cherche ta buddy.
      </h1>
      <p className={styles.texte}>
        Une femme en chemin depuis à peu près aussi longtemps que toi, si possible sur {quete}. On te prévient ici dès qu&apos;on l&apos;a trouvée.
      </p>
      <p className={styles.petit}>Phase de test : la recherche est simulée.</p>
      <Link href="/chemin" className={styles.lien}>
        Retour à mon chemin
      </Link>
    </section>
  );
}

/** Trouvée : elle la rencontre quand elle veut. */
function Trouvee() {
  return (
    <section className={`${styles.trouvee} ${m.monte}`} aria-labelledby="trouvee">
      <h1 id="trouvee" className={styles.titre}>
        On a trouvé ta buddy.
      </h1>
      <form action={rencontrer}>
        <button type="submit" className="bouton bouton--blanc">
          La rencontrer
        </button>
      </form>
    </section>
  );
}

function Rencontre({ autre, questions, prochaine }: { autre: Autre; questions: Question[]; prochaine: string | null }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [confirmer, setConfirmer] = useState(false);
  const actuelle = questions[questions.length - 1];
  const passees = questions.slice(0, -1).reverse();

  return (
    <>
      <p className={styles.mention} role="note">
        {autre.mention}
      </p>
      <section className={`${styles.autre} ${m.monte}`} aria-labelledby="autre">
        <span className={styles.etiquette}>Ta buddy</span>
        <h1 id="autre" className={styles.nom}>
          {autre.prenom}
        </h1>
        <span className={styles.quete}>
          {autre.prenom}, en chemin depuis {autre.jours} jours, sur {autre.quete}.
        </span>
        <p className={styles.phrase}>« {autre.presentation} »</p>
      </section>

      {actuelle ? <QuestionDeLaSemaine q={actuelle} autre={autre.prenom} prochaine={prochaine} onRepondu={() => router.refresh()} /> : null}

      {/* Les questions passées : lisibles, repliées, la plus récente en haut */}
      {passees.length ? (
        <details className={styles.passees}>
          <summary>Les semaines d&apos;avant ({passees.length})</summary>
          <div className={`${styles.passeesListe} ${m.deplie}`}>
            {passees.map((q) => (
              <div key={q.numero} className={styles.echange}>
                <span className={styles.question}>
                  Semaine {q.numero} : {q.texte}
                </span>
                <Reponses q={q} autre={autre.prenom} />
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* « Comment ça marche » : le texte d'explication, et tout en bas, en petit, la sortie */}
      <details className={styles.comment}>
        <summary>Comment ça marche</summary>
        <div className={`${styles.commentTexte} ${m.deplie}`}>
          <ul>
            {POINTS_BUDDY.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className={styles.petit}>
            Tu peux arrêter l&apos;échange quand tu veux.{" "}
            {confirmer ? (
              <>
                {autre.prenom} verra seulement « L&apos;échange s&apos;est arrêté. ».{" "}
                <button type="button" className={styles.lienPetit} disabled={enCours} onClick={() => demarrer(async () => (await arreterEchange(), router.refresh()))}>
                  Oui, arrêter
                </button>{" "}
                <button type="button" className={styles.lienPetit} onClick={() => setConfirmer(false)}>
                  Non
                </button>
              </>
            ) : (
              <button type="button" className={styles.lienPetit} onClick={() => setConfirmer(true)}>
                Arrêter l&apos;échange
              </button>
            )}
          </p>
        </div>
      </details>
    </>
  );
}

function Reponses({ q, autre }: { q: Question; autre: string }) {
  return (
    <div className={styles.reponses}>
      <div className={styles.reponse}>
        <span className={styles.qui}>Toi</span>
        <p>{q.maReponse}</p>
      </div>
      <div className={`${styles.reponse} ${styles.reponseAutre}`}>
        <span className={styles.qui}>{autre}</span>
        <p>{q.saReponse ?? "Pas encore de réponse."}</p>
      </div>
    </div>
  );
}

function QuestionDeLaSemaine({ q, autre, prochaine, onRepondu }: { q: Question; autre: string; prochaine: string | null; onRepondu: () => void }) {
  const [texte, setTexte] = useState(q.maReponse);
  const [etat, setEtat] = useState<"rien" | "envoi" | "note" | "erreur">(q.maReponse ? "note" : "rien");
  const [vient, setVient] = useState(false);

  return (
    <section className={styles.bloc} aria-labelledby="question">
      <span className={styles.etiquette}>
        Mois {Math.ceil(q.numero / 4)}, question {((q.numero - 1) % 4) + 1} sur 4 · la même pour vous deux
      </span>
      <h2 id="question" className={styles.questionTitre}>
        {q.texte}
      </h2>
      {q.maReponse && etat === "note" ? (
        <div className={vient ? m.monte : undefined}>
          <Reponses q={q} autre={autre} />
          {/* La suite, dite tout de suite */}
          <p className={styles.suite}>{prochaine ? <>Prochaine question <strong>{prochaine}</strong>.</> : "C'était la dernière question pour l'instant."}</p>
        </div>
      ) : (
        <>
          <label className={styles.champ}>
            <span>Ta réponse, en quelques lignes</span>
            <textarea value={texte} rows={4} maxLength={2000} onChange={(e) => setTexte(e.target.value)} />
          </label>
          <p className={styles.petit}>La réponse {de(autre)} s&apos;affiche quand tu as répondu. Pas besoin d&apos;être au même jour.</p>
          <div className={styles.actions}>
            <button
              type="button"
              className="bouton"
              disabled={etat === "envoi" || !texte.trim()}
              onClick={async () => {
                setEtat("envoi");
                const r = await repondreQuestion(q.numero, q.texte, texte).catch(() => ({ ok: false }));
                setEtat(r.ok ? "note" : "erreur");
                if (r.ok) {
                  setVient(true);
                  onRepondu();
                }
              }}
            >
              Répondre
            </button>
            {etat === "erreur" ? <span role="alert">Pas enregistré, réessaie.</span> : null}
          </div>
        </>
      )}
      {etat === "note" && vient ? <CestNote suite="Gardé dans ton carnet." /> : null}
    </section>
  );
}
