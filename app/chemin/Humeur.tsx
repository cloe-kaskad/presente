"use client";

import Link from "next/link";
import { CestNote } from "@/components/CestNote";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HUMEURS } from "@/lib/rituel/humeurs";
import { noterHumeur } from "./actions";
import styles from "./espace.module.css";

/** « Comment tu vas, aujourd'hui ? » : un mot, une phrase si elle veut, une fois par jour (modifiable). */
export function Humeur({ initiale, noteInitiale }: { initiale?: string; noteInitiale?: string }) {
  const router = useRouter();
  const [humeur, setHumeur] = useState(initiale ?? "");
  const [note, setNote] = useState(noteInitiale ?? "");
  const [etat, setEtat] = useState<"idle" | "note" | "erreur">(initiale ? "note" : "idle");
  // La coche ne se dessine que quand elle vient d'enregistrer, pas à l'ouverture de la page.
  const [vient, setVient] = useState(false);
  const [enCours, demarrer] = useTransition();

  const envoyer = () =>
    demarrer(async () => {
      const r = await noterHumeur(humeur, note).catch(() => ({ ok: false, detresse: false }));
      if (r.detresse) router.push("/quand-ca-ne-va-pas");
      else {
        setEtat(r.ok ? "note" : "erreur");
        setVient(r.ok);
      }
    });

  return (
    <section className={`${styles.bloc} ${styles.humeur}`} aria-labelledby="humeur-titre">
      <h3 id="humeur-titre" className={styles.blocTitre}>
        Comment tu vas, aujourd&apos;hui ?
      </h3>
      <div className={styles.puces} role="radiogroup" aria-labelledby="humeur-titre">
        {HUMEURS.map((h) => (
          <button
            key={h}
            type="button"
            role="radio"
            aria-checked={humeur === h}
            className={`${styles.puce} ${humeur === h ? styles.puceChoisie : ""}`}
            onClick={() => {
              setHumeur(h);
              if (etat === "note") setEtat("idle");
            }}
          >
            {h}
          </button>
        ))}
      </div>
      <label className={styles.ligneLibre}>
        <span>
          Pourquoi, en une phrase ? <span className={styles.facultatif}>(si tu veux)</span>
        </span>
        <input
          className="champ"
          value={note}
          maxLength={300}
          onChange={(e) => {
            setNote(e.target.value);
            if (etat === "note") setEtat("idle");
          }}
        />
      </label>
      <div className={styles.actions}>
        {etat === "note" ? (
          <CestNote anime={vient} className={styles.note} />
        ) : (
          <button type="button" className="bouton" onClick={envoyer} disabled={!humeur || enCours}>
            {enCours ? "J'enregistre…" : "Noter ma journée"}
          </button>
        )}
        <Link href="/journal" className={styles.lienDiscret}>
          Voir mon journal
        </Link>
      </div>
      {etat === "erreur" ? (
        <p className={styles.erreur} role="alert">
          Ce n&apos;est pas enregistré. Vérifie ta connexion et réessaie.
        </p>
      ) : null}
    </section>
  );
}
