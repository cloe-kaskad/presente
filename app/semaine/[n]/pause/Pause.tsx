"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { marquerPauseFaite } from "../../actions";
import { Guidage } from "../exercice/Guidage";
import styles from "../fil/fil.module.css";

export function Pause({
  n,
  nom,
  enBref,
  consigne,
  guidage,
  faiteLe,
}: {
  n: number;
  nom: string;
  enBref: string | null;
  consigne: string | null;
  guidage: { cle: string; fichier: string; provisoire: string | null };
  faiteLe: number | null;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  return (
    <main className={styles.page}>
      <div className={styles.tete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.surtitre}>Une pause guidée · 5 minutes</span>
        <h1 className={styles.titre}>{nom}</h1>
        {enBref ? <p className={styles.chapo}>{enBref}</p> : null}
      </div>
      <div className={styles.pause}>
        <Guidage n={n} cle={guidage.cle} fichier={guidage.fichier} provisoire={guidage.provisoire} />
        {consigne ? (
          <section className={styles.pauseTexte} aria-labelledby="pause-consigne">
            <h2 id="pause-consigne" className={styles.pauseEtiquette}>
              Si tu préfères lire
            </h2>
            <p>{consigne}</p>
          </section>
        ) : null}
      </div>
      <section className={styles.fin} aria-label="Fin de la pause">
        <div className={styles.actions}>
          <button
            type="button"
            className="bouton"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                await marquerPauseFaite(n).catch(() => null);
                router.push("/chemin");
              })
            }
          >
            {faiteLe ? "C'est fait, retour à mon chemin" : "C'est fait"}
          </button>
          <span className={styles.aide}>Tu pourras y revenir depuis ton chemin.</span>
        </div>
      </section>
    </main>
  );
}
