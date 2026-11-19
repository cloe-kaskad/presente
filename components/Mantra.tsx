"use client";

import { useEffect, useState } from "react";
import { Marque } from "@/components/Marque";
import styles from "./Mantra.module.css";

/** Des phrases de femmes, toutes du domaine public. Traductions maison. */
export const MANTRAS = [
  { texte: "J’habite le possible.", autrice: "Emily Dickinson", source: "poème, vers 1862" },
  { texte: "Il n’y a ni grille, ni serrure, ni verrou que vous puissiez poser sur la liberté de mon esprit.", autrice: "Virginia Woolf", source: "Une chambre à soi, 1929" },
  { texte: "Femme, réveille-toi.", autrice: "Olympe de Gouges", source: "Déclaration des droits de la femme et de la citoyenne, 1791" },
  { texte: "Je ne suis pas un oiseau, et aucun filet ne me retient.", autrice: "Charlotte Brontë", source: "Jane Eyre, 1847" },
  { texte: "Je n’ai pas peur des tempêtes : j’apprends à mener mon bateau.", autrice: "Louisa May Alcott", source: "Les Quatre Filles du docteur March, 1869" },
  { texte: "Je ne souhaite pas qu’elles aient du pouvoir sur les hommes, mais sur elles-mêmes.", autrice: "Mary Wollstonecraft", source: "Défense des droits de la femme, 1792" },
  { texte: "Mon courage grandit chaque fois qu’on essaie de m’intimider.", autrice: "Jane Austen", source: "Orgueil et Préjugés, 1813" },
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
    const t = setInterval(() => setI((n) => ((n ?? 0) + 1) % MANTRAS.length), 3800);
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
          {i === null ? " " : `« ${MANTRAS[i].texte} »`}
        </p>
        {i === null ? null : (
          <span key={`a${i}`} className={styles.autrice}>
            <strong>{MANTRAS[i].autrice}</strong>, {MANTRAS[i].source}
          </span>
        )}
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
