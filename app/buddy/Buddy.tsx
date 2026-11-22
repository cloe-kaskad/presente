"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CestNote } from "@/components/CestNote";
import m from "@/components/mouvement.module.css";
import type { EtatBuddy } from "@/lib/buddy/etat";
import { arreterEchange, repondreQuestion, sePresenter } from "./actions";
import styles from "./buddy.module.css";

type Moi = { prenom: string | null; quete: string; presentation: string; montrePrenom: boolean; montreQuete: boolean };
type Autre = { prenom: string; quete: string; presentation: string; mention: string };
type Question = { numero: number; texte: string; maReponse: string; saReponse: string | null };

/** « Un bout de chemin à deux » : se présenter, rencontrer, une question par semaine, sortir à tout moment. */
export function Buddy({ etat, moi, autre, questions }: { etat: EtatBuddy; moi: Moi; autre: Autre; questions: Question[] }) {
  return (
    <main className={styles.page}>
      <div className={styles.tete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.surtitre}>Un bout de chemin à deux</span>
      </div>
      {etat === "proposee" ? <Presentation moi={moi} /> : null}
      {etat === "acceptee" ? <Rencontre moi={moi} autre={autre} questions={questions} /> : null}
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

function Presentation({ moi }: { moi: Moi }) {
  const router = useRouter();
  const [phrase, setPhrase] = useState(moi.presentation);
  const [prenom, setPrenom] = useState(true);
  const [quete, setQuete] = useState(true);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState(false);

  return (
    <section className={styles.bloc} aria-labelledby="presentation">
      <h1 id="presentation" className={styles.titre}>
        Présente-toi en une phrase.
      </h1>
      <p className={styles.texte}>
        Une autre femme en chemin la lira. Rien d&apos;autre n&apos;est partagé : ni ton carnet, ni ton journal, ni ta carte.
      </p>
      <label className={styles.champ}>
        <span>Ce qui m&apos;amène ici, en une phrase</span>
        <textarea value={phrase} maxLength={300} rows={3} onChange={(e) => setPhrase(e.target.value)} placeholder="Une phrase suffit." />
      </label>
      <fieldset className={styles.cases}>
        <legend>Ce que tu acceptes de montrer</legend>
        <label>
          <input type="checkbox" checked={prenom} onChange={(e) => setPrenom(e.target.checked)} /> Mon prénom{moi.prenom ? ` (${moi.prenom})` : ""}
        </label>
        <label>
          <input type="checkbox" checked={quete} onChange={(e) => setQuete(e.target.checked)} /> Ma quête du moment ({moi.quete})
        </label>
      </fieldset>
      <div className={styles.actions}>
        <button
          type="button"
          className="bouton"
          disabled={enCours || !phrase.trim()}
          onClick={() =>
            demarrer(async () => {
              const r = await sePresenter(phrase, prenom, quete).catch(() => ({ ok: false }));
              if (r.ok) router.refresh();
              else setErreur(true);
            })
          }
        >
          Me présenter
        </button>
        <Link href="/chemin" className={styles.lien}>
          Pas maintenant
        </Link>
      </div>
      {erreur ? <p role="alert">Ce n&apos;est pas enregistré. Réessaie dans un instant.</p> : null}
    </section>
  );
}

function Rencontre({ moi, autre, questions }: { moi: Moi; autre: Autre; questions: Question[] }) {
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
        <span className={styles.quete}>En chemin sur {autre.quete}</span>
        <p className={styles.phrase}>« {autre.presentation} »</p>
      </section>

      {actuelle ? <QuestionDeLaSemaine q={actuelle} autre={autre.prenom} onRepondu={() => router.refresh()} /> : null}

      {passees.length ? (
        <section className={styles.bloc} aria-labelledby="passees">
          <h2 id="passees" className={styles.sousTitre}>
            Les semaines d&apos;avant
          </h2>
          {passees.map((q) => (
            <div key={q.numero} className={styles.echange}>
              <span className={styles.question}>{q.texte}</span>
              <Reponses q={q} autre={autre.prenom} />
            </div>
          ))}
        </section>
      ) : null}

      <section className={styles.toi} aria-labelledby="toi">
        <h2 id="toi" className={styles.sousTitre}>
          Ce que {autre.prenom} voit de toi
        </h2>
        <p className={styles.texte}>
          {[moi.montrePrenom && moi.prenom ? moi.prenom : null, moi.montreQuete ? `en chemin sur ${moi.quete}` : null].filter(Boolean).join(", ") || "Ni ton prénom, ni ta quête."}
          {moi.presentation ? ` · « ${moi.presentation} »` : ""}
        </p>
        <p className={styles.petit}>Et tes réponses aux questions de la semaine. Rien d&apos;autre : ni ton carnet, ni ton journal, ni ta carte.</p>
      </section>

      <div className={styles.sortir}>
        {confirmer ? (
          <>
            <span>Arrêter l&apos;échange ? {autre.prenom} verra seulement « L&apos;échange s&apos;est arrêté. ».</span>
            <button type="button" className={styles.lien} disabled={enCours} onClick={() => demarrer(async () => (await arreterEchange(), router.refresh()))}>
              Oui, arrêter
            </button>
            <button type="button" className={styles.lien} onClick={() => setConfirmer(false)}>
              Non
            </button>
          </>
        ) : (
          <button type="button" className={styles.lien} onClick={() => setConfirmer(true)}>
            Arrêter l&apos;échange
          </button>
        )}
      </div>
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

function QuestionDeLaSemaine({ q, autre, onRepondu }: { q: Question; autre: string; onRepondu: () => void }) {
  const [texte, setTexte] = useState(q.maReponse);
  const [etat, setEtat] = useState<"rien" | "envoi" | "note" | "erreur">(q.maReponse ? "note" : "rien");
  const [vient, setVient] = useState(false);

  return (
    <section className={styles.bloc} aria-labelledby="question">
      <span className={styles.etiquette}>La question de la semaine, la même pour vous deux</span>
      <h2 id="question" className={styles.questionTitre}>
        {q.texte}
      </h2>
      {q.maReponse && etat === "note" ? (
        <div className={vient ? m.monte : undefined}>
          <Reponses q={q} autre={autre} />
        </div>
      ) : (
        <>
          <label className={styles.champ}>
            <span>Ta réponse, en quelques lignes</span>
            <textarea value={texte} rows={4} maxLength={2000} onChange={(e) => setTexte(e.target.value)} />
          </label>
          <p className={styles.petit}>La réponse de {autre} s&apos;affiche quand tu as répondu. Pas besoin d&apos;être au même jour.</p>
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
