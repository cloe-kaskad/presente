"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CestNote } from "@/components/CestNote";
import { COULEUR, HUMEURS, estHumeur } from "@/lib/rituel/humeurs";
import { noterHumeur } from "./actions";
import styles from "./espace.module.css";

/**
 * « Comment tu vas, aujourd'hui ? » : un mot, une phrase si elle veut, une fois par jour (modifiable).
 * La même carte sur Mon chemin et en haut de Mon journal (brief V0.12). Déjà notée aujourd'hui, elle se replie :
 * « Aujourd'hui, tu as noté calme. », sa phrase, et « Modifier » qui la rouvre avec son choix.
 */
export function Humeur({ initiale, noteInitiale, surJournal = false }: { initiale?: string; noteInitiale?: string; surJournal?: boolean }) {
  const router = useRouter();
  const Titre = surJournal ? "h2" : "h3";
  // Ce qui est enregistré pour aujourd'hui (la carte repliée le montre).
  const [notee, setNotee] = useState<{ humeur: string; note: string } | null>(initiale ? { humeur: initiale, note: noteInitiale ?? "" } : null);
  const [ouverte, setOuverte] = useState(!initiale);
  const [humeur, setHumeur] = useState(initiale ?? "");
  const [note, setNote] = useState(noteInitiale ?? "");
  const [erreur, setErreur] = useState(false);
  // La coche ne se dessine que quand elle vient d'enregistrer, pas à l'ouverture de la page.
  const [vient, setVient] = useState(false);
  const [enCours, demarrer] = useTransition();

  const envoyer = () =>
    demarrer(async () => {
      const r = await noterHumeur(humeur, note).catch(() => ({ ok: false, detresse: false }));
      if (r.detresse) {
        router.push("/quand-ca-ne-va-pas");
        return;
      }
      setErreur(!r.ok);
      if (r.ok) {
        setNotee({ humeur, note: note.trim() });
        setOuverte(false);
        setVient(true);
        // Le calendrier et la liste du journal (et Mon chemin) se mettent à jour sans recharger la page.
        router.refresh();
      }
    });

  return (
    <section id="comment-tu-vas" className={`${styles.bloc} ${styles.humeur}`} aria-labelledby="humeur-titre" tabIndex={-1}>
      <Titre id="humeur-titre" className={styles.blocTitre}>
        Comment tu vas, aujourd&apos;hui ?
      </Titre>
      {!ouverte && notee ? (
        <div className={styles.humeurRepliee}>
          <i style={{ background: estHumeur(notee.humeur) ? COULEUR[notee.humeur].fond : "var(--blanc)" }} aria-hidden="true" />
          <div className={styles.humeurReplieeTexte}>
            <span>
              Aujourd&apos;hui, tu as noté <strong>{notee.humeur}</strong>.
            </span>
            {notee.note ? <span className={styles.humeurPhrase}>« {notee.note} »</span> : null}
            {vient ? <CestNote anime className={styles.note} /> : null}
          </div>
          <button
            type="button"
            className={styles.modifier}
            onClick={() => {
              setHumeur(notee.humeur);
              setNote(notee.note);
              setVient(false);
              setOuverte(true);
            }}
          >
            Modifier
          </button>
        </div>
      ) : (
        <>
          <div className={styles.puces} role="radiogroup" aria-labelledby="humeur-titre">
            {HUMEURS.map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={humeur === h}
                className={`${styles.puce} ${humeur === h ? styles.puceChoisie : ""}`}
                onClick={() => setHumeur(h)}
              >
                {h}
              </button>
            ))}
          </div>
          <label className={styles.ligneLibre}>
            <span>
              Pourquoi, en une phrase ? <span className={styles.facultatif}>(si tu veux)</span>
            </span>
            <input className="champ" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="button" className="bouton" onClick={envoyer} disabled={!humeur || enCours}>
              {enCours ? "J'enregistre…" : "Noter ma journée"}
            </button>
            {surJournal ? null : (
              <Link href="/journal" className={styles.lienDiscret}>
                Voir mon journal
              </Link>
            )}
          </div>
          {erreur ? (
            <p className={styles.erreur} role="alert">
              Ce n&apos;est pas enregistré. Vérifie ta connexion et réessaie.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
