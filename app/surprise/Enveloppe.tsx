"use client";

import { useEffect, useState } from "react";
import styles from "./surprise.module.css";

/**
 * L'enveloppe qui s'ouvre sur une carte postale (animation courte, une seule fois). Recto : l'illustration de
 * Stéphanie quand elle sera déposée (public/images/surprise-carte.jpg), sinon une image de substitution dans la charte.
 * Verso : le mot fixe, signé « Présente ! ».
 */
export function Enveloppe({ mot, animer }: { mot: string; animer: boolean }) {
  // L'illustration ne s'affiche que si le fichier existe vraiment (pas d'image cassée en attendant).
  const [illustration, setIllustration] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setIllustration(true);
    img.src = "/images/surprise-carte.jpg";
  }, []);
  return (
    <div className={`${styles.scene} ${animer ? styles.animer : ""}`}>
      <div className={styles.enveloppe} aria-hidden="true">
        <span className={styles.rabat} />
      </div>
      <div className={styles.carte}>
        <div className={styles.recto}>
          {illustration ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/surprise-carte.jpg" alt="" className={styles.illustration} />
          ) : null}
          <span className={styles.rectoHaut}>/ Pour toi</span>
          <span className={styles.rectoMarque}>Présente&nbsp;!</span>
        </div>
        <div className={styles.verso}>
          <p className={styles.mot}>{mot}</p>
          <div className={styles.adresse}>
            <span className={styles.signature}>Présente !</span>
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
