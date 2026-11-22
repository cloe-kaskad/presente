"use client";

import { CestNote } from "@/components/CestNote";
import { useState } from "react";
import { enregistrerEntree } from "@/app/carnet/actions";
import { REPONSES_ECHO } from "@/lib/rituel/echo";
import styles from "./espace.module.css";

/** « Tu écrivais ça le 4 novembre. » Puis : c'est toujours vrai ? La réponse va dans le carnet. */
export function Echo({
  semaine,
  jour,
  dateEcrite,
  mots,
  dejaChoisi,
  dejaLigne,
}: {
  semaine: number;
  jour: string;
  dateEcrite: string;
  mots: string;
  dejaChoisi?: string;
  dejaLigne?: string;
}) {
  const [choix, setChoix] = useState(dejaChoisi ?? "");
  const [ligne, setLigne] = useState(dejaLigne ?? "");
  const [etat, setEtat] = useState<"idle" | "ok" | "erreur">(dejaChoisi ? "ok" : "idle");
  const [vient, setVient] = useState(false);

  const enregistrer = async (c: string, l: string) => {
    const r = await enregistrerEntree({
      semaine,
      type: "carnet",
      code: `echo:${jour}`,
      question: `Tu écrivais ça le ${dateEcrite} : « ${mots} ». C'est toujours vrai ?`,
      reponse: l.trim() ? `${c} · ${l.trim()}` : c,
    }).catch(() => ({ ok: false }));
    setEtat(r.ok ? "ok" : "erreur");
    setVient(r.ok);
  };

  return (
    <section className={`${styles.bloc} ${styles.echo}`} aria-labelledby="echo-titre">
      <span id="echo-titre" className={styles.echoDate}>
        Tu écrivais ça le {dateEcrite}
      </span>
      <p className={styles.echoMots}>« {mots} »</p>
      <span className={styles.echoQuestion} id="echo-question">
        C&apos;est toujours vrai ?
      </span>
      <div className={styles.puces} role="radiogroup" aria-labelledby="echo-question">
        {REPONSES_ECHO.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={choix === r}
            className={`${styles.puce} ${choix === r ? styles.puceChoisie : ""}`}
            onClick={() => {
              setChoix(r);
              void enregistrer(r, ligne);
            }}
          >
            {r}
          </button>
        ))}
      </div>
      {choix ? (
        <label className={styles.ligneLibre}>
          <span>
            Ce qui a changé, en une ligne <span className={styles.facultatif}>(si tu veux)</span>
          </span>
          <input
            className="champ"
            value={ligne}
            maxLength={300}
            onChange={(e) => setLigne(e.target.value)}
            onBlur={() => void enregistrer(choix, ligne)}
          />
        </label>
      ) : null}
      {etat === "ok" ? (
        <CestNote anime={vient} suite="Gardé dans ton carnet." className={styles.note} />
      ) : (
        <span className={styles.note} role="status" aria-live="polite">
          {etat === "erreur" ? "Pas enregistré, vérifie ta connexion." : ""}
        </span>
      )}
    </section>
  );
}
