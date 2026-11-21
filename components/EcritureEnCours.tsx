"use client";

import { useEffect, useState } from "react";
import { CITATIONS } from "@/lib/rituel/citations";
import { BarreEspace } from "./BarreEspace";
import styles from "./EnAttente.module.css";

const ETAPES = ["On relit ce que tu viens de noter", "On l’écrit avec tes mots", "On le range dans ton chemin"];

/**
 * Pendant que le moteur écrit l'exercice, le geste ou le palier (maquette Attente-creation) :
 * on dit ce qui se passe, sans citation.
 */
export function EcritureEnCours({ surtitre, titre }: { surtitre: string; titre: string }) {
  // Les étapes avancent avec le temps : la première tout de suite, la dernière vers huit secondes.
  const [active, setActive] = useState(0);
  // Une citation pour patienter, choisie à l'ouverture de l'écran.
  const [citation, setCitation] = useState<(typeof CITATIONS)[number] | null>(null);
  useEffect(() => {
    const t1 = setTimeout(() => setActive(1), 1500);
    const t2 = setTimeout(() => setActive(2), 8000);
    setCitation(CITATIONS[Math.floor(Math.random() * CITATIONS.length)]);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={styles.ecriture}>
      <BarreEspace courante="chemin" />
      <main className={styles.ecritureCorps}>
        <span className={styles.surtitre}>{surtitre}</span>
        <h1 className={styles.titre}>{titre}</h1>
        <ol className={styles.etapes} role="status" aria-live="polite">
          {ETAPES.map((e, i) => {
            const etat = i < active ? "faite" : i === active ? "active" : "avenir";
            return (
              <li key={e} className={`${styles.etape} ${etat === "active" ? styles.etapeActive : etat === "avenir" ? styles.etapeAVenir : ""}`}>
                <span
                  aria-hidden="true"
                  className={`${styles.puce} ${etat === "faite" ? styles.puceFaite : etat === "active" ? styles.puceActive : styles.puceAVenir}`}
                >
                  {etat === "faite" ? "✓" : ""}
                </span>
                {e}
                {etat === "faite" ? <span className="sr-only"> (fait)</span> : etat === "active" ? <span className="sr-only"> (en cours)</span> : null}
              </li>
            );
          })}
        </ol>
        <span className={styles.aide}>Une dizaine de secondes. Tu peux rester ici.</span>
        {citation ? (
          <figure className={styles.citation}>
            <blockquote>« {citation.texte} »</blockquote>
            <figcaption>
              <strong>{citation.autrice}</strong>, {citation.source}
            </figcaption>
          </figure>
        ) : null}
      </main>
    </div>
  );
}
