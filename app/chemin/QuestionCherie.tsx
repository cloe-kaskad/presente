"use client";

import { CestNote } from "@/components/CestNote";
import { useState } from "react";
import { enregistrerEntree } from "@/app/carnet/actions";
import { choisirNewsletter } from "./actions";
import styles from "./espace.module.css";

/** La Question Chérie : la question de la lettre, une ligne pour y répondre (dans le carnet), le lien vers la lettre. */
export function QuestionCherie({
  semaine,
  id,
  question,
  lien,
  reponseInitiale,
  abonnee,
}: {
  semaine: number;
  id: string;
  question: string;
  lien: string | null;
  reponseInitiale?: string;
  abonnee: boolean;
}) {
  const [reponse, setReponse] = useState(reponseInitiale ?? "");
  const [etat, setEtat] = useState<"idle" | "en_cours" | "ok" | "erreur">(reponseInitiale ? "ok" : "idle");
  const [vient, setVient] = useState(false);
  const [inscrite, setInscrite] = useState(false);

  const garder = async () => {
    if (!reponse.trim()) return;
    setEtat("en_cours");
    const r = await enregistrerEntree({
      semaine,
      type: "carnet",
      code: `qc:${id.toLowerCase()}`,
      question: `La Question Chérie : ${question}`,
      reponse: reponse.trim(),
    }).catch(() => ({ ok: false }));
    setEtat(r.ok ? "ok" : "erreur");
    setVient(r.ok);
  };

  return (
    <section className={`${styles.bloc} ${styles.qc}`} aria-labelledby="qc-titre">
      <div className={styles.qcHaut}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/ecrire.jpg" alt="" className={styles.qcImage} />
        <div>
          <span id="qc-titre" className={styles.qcNom}>
            La Question Chérie
          </span>
          <span className={styles.qcSous}>La lettre de Liberté, Chérie !</span>
        </div>
      </div>
      <p className={styles.qcQuestion}>{question}</p>
      <label className="sr-only" htmlFor="qc-reponse">
        Ta réponse, en une ligne
      </label>
      <input
        id="qc-reponse"
        className={`champ ${styles.qcChamp}`}
        placeholder="Ta réponse, en une ligne"
        value={reponse}
        maxLength={300}
        onChange={(e) => {
          setReponse(e.target.value);
          if (etat === "ok") setEtat("idle");
        }}
      />
      <div className={styles.actions}>
        {etat === "ok" ? (
          <CestNote anime={vient} suite="Gardé dans ton carnet." className={styles.qcNote} />
        ) : (
          <button type="button" className={`bouton ${styles.qcBouton}`} onClick={garder} disabled={!reponse.trim() || etat === "en_cours"}>
            Garder dans mon carnet
          </button>
        )}
        {lien ? (
          <a href={lien} target="_blank" rel="noopener noreferrer" className={styles.qcLien}>
            Lire la lettre<span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
          </a>
        ) : null}
      </div>
      {etat === "erreur" ? <p className={styles.qcNote}>Pas enregistré, vérifie ta connexion.</p> : null}
      {!abonnee ? (
        <label className={styles.qcCase}>
          <input
            type="checkbox"
            checked={inscrite}
            onChange={(e) => {
              setInscrite(e.target.checked);
              void choisirNewsletter(e.target.checked);
            }}
          />
          Recevoir La Question Chérie, deux mercredis par mois
        </label>
      ) : null}
    </section>
  );
}
