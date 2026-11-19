"use client";

import { useMemo, useState } from "react";
import styles from "./carnet.module.css";

export type Ligne = { question: string; reponse: string; geste?: boolean };
export type Groupe = { titre: string; lignes: Ligne[] };

const sans = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Carnet({ groupes }: { groupes: Groupe[] }) {
  const [recherche, setRecherche] = useState("");
  const visibles = useMemo(() => {
    const r = sans(recherche.trim());
    if (!r) return groupes;
    return groupes
      .map((g) => ({ ...g, lignes: g.lignes.filter((l) => sans(`${l.question} ${l.reponse}`).includes(r)) }))
      .filter((g) => g.lignes.length);
  }, [groupes, recherche]);

  return (
    <main className={styles.page}>
      <div className={styles.haut}>
        <h1 className={`titre-nom ${styles.titre}`}>Carnet</h1>
        <a href="/carnet/telecharger" className={styles.telecharger}>
          Télécharger
        </a>
      </div>
      <label htmlFor="recherche" className="sr-only">
        Chercher dans mon carnet
      </label>
      <input
        id="recherche"
        type="search"
        className="champ"
        placeholder="Chercher un mot, une personne…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {groupes.length === 0 ? (
        <p className={styles.vide}>Ton carnet est encore vide. Tout ce que tu écris en chemin viendra s&apos;y ranger.</p>
      ) : visibles.length === 0 ? (
        <p className={styles.vide} role="status">
          Rien ne correspond à « {recherche} ».
        </p>
      ) : (
        <div className={styles.groupes}>
          {visibles.map((g) => (
            <section key={g.titre} className={styles.groupe}>
              <h2 className={styles.groupeTitre}>
                <span className={styles.slash}>/</span> {g.titre}
              </h2>
              {g.lignes.map((l, i) => (
                <div key={i} className={styles.ligne}>
                  <span className={styles.question}>{l.question}</span>
                  {l.geste ? <p className={styles.geste}>{l.reponse}</p> : <p className={styles.reponse}>« {l.reponse} »</p>}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
      <p className={styles.note}>Ton carnet n&apos;est lu par personne de l&apos;équipe. Il sert à toi, et à adapter ton chemin.</p>
    </main>
  );
}
