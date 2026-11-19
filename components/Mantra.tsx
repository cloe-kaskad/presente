"use client";

import { useEffect, useState } from "react";
import { Marque } from "@/components/Marque";
import styles from "./Mantra.module.css";

export const MANTRAS = [
  "Personne ne peut faire le chemin à ta place.",
  "Une question à la fois.",
  "Tu n'as rien à prouver ici.",
  "Ce que tu écris compte.",
  "Aller doucement, c'est aller quand même.",
  "Tu es déjà quelqu'un d'intéressant.",
  "Ici, on n'apprend pas à répondre. On apprend à questionner.",
];

/** Un écran de respiration, pendant un chargement : une phrase, sur le fond à grain. */
export function Mantra({ depart = 0, defile = false, surtitre }: { depart?: number; defile?: boolean; surtitre?: string }) {
  const [i, setI] = useState<number | null>(defile ? depart : null);

  useEffect(() => {
    // Sans défilement : une phrase choisie au hasard, une fois la page affichée.
    if (!defile) {
      setI(Math.floor(Math.random() * MANTRAS.length));
      return;
    }
    const t = setInterval(() => setI((n) => ((n ?? 0) + 1) % MANTRAS.length), 2600);
    return () => clearInterval(t);
  }, [defile]);

  return (
    <div className={styles.page} role="status" aria-live="polite">
      <header className={styles.entete}>
        <Marque />
      </header>
      <main className={styles.centre}>
        {surtitre ? <span className={styles.surtitre}>{surtitre}</span> : null}
        <p key={i ?? "vide"} className={styles.phrase}>
          {i === null ? " " : MANTRAS[i]}
        </p>
        <span className={styles.points} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="sr-only">Chargement en cours</span>
      </main>
    </div>
  );
}
