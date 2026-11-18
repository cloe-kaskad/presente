"use client";

import styles from "./Curseur.module.css";

/** Un curseur de 1 à 5, fait de cinq boutons radio : clair au doigt comme au clavier. */
export function Curseur({
  nom,
  legende,
  valeur,
  onChange,
  gauche,
  droite,
  surFond = "blanc",
}: {
  nom: string;
  legende: React.ReactNode;
  valeur: number | undefined;
  onChange: (v: number) => void;
  gauche: string;
  droite: string;
  surFond?: "blanc" | "rose";
}) {
  return (
    <fieldset className={`${styles.curseur} ${surFond === "rose" ? styles.surRose : ""}`}>
      <legend className={styles.legende}>{legende}</legend>
      <div className={styles.points}>
        {[1, 2, 3, 4, 5].map((v) => (
          <label key={v} className={styles.point}>
            <input
              type="radio"
              name={nom}
              value={v}
              checked={valeur === v}
              onChange={() => onChange(v)}
            />
            <span className={styles.rond} aria-hidden="true" />
            <span className="sr-only">
              {v} sur 5{v === 1 ? ` : ${gauche}` : v === 5 ? ` : ${droite}` : ""}
            </span>
          </label>
        ))}
        <span className={styles.trait} aria-hidden="true" />
      </div>
      <div className={styles.bornes} aria-hidden="true">
        <span>{gauche}</span>
        <span>{droite}</span>
      </div>
    </fieldset>
  );
}
