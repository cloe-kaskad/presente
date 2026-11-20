"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExerciceDuChemin } from "@/lib/semaines/exercice";
import styles from "./exercices.module.css";

const capitale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const dateCourte = (jour: string) =>
  new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

/** « Mes exercices en cours » (maquettes Exercices-etats et D-Exercices-etats). */
export function MesExercices({ exercices }: { exercices: ExerciceDuChemin[] }) {
  const [ouvert, setOuvert] = useState(false);
  const enCours = exercices.filter((e) => e.etat !== "termine");
  const termines = exercices.filter((e) => e.etat === "termine");

  return (
    <section className={styles.zone} aria-labelledby="mes-exercices">
      <div className={styles.haut}>
        <h2 id="mes-exercices" className={styles.titre}>
          Mes exercices en cours.
        </h2>
        {termines.length ? (
          <button type="button" className={styles.lienTermines} aria-expanded={ouvert} aria-controls="exercices-termines" onClick={() => setOuvert(!ouvert)}>
            Exercices terminés ({termines.length}) {ouvert ? "▴" : "▾"}
          </button>
        ) : null}
      </div>

      {enCours.length ? (
        <div className={styles.grille}>
          {enCours.map((e) => (
            <Link key={e.n} href={`/semaine/${e.n}/exercice`} className={styles.carte}>
              <span className={styles.rythme}>{e.rythme ? capitale(e.rythme) : e.agir ? "Ton geste" : "Exercice"}</span>
              <span className={styles.nom}>{e.nom}</span>
              {e.total ? (
                <span className={styles.barre} role="img" aria-label={`${e.notes} jour${e.notes > 1 ? "s" : ""} noté${e.notes > 1 ? "s" : ""} sur ${e.total}`}>
                  {Array.from({ length: e.total }, (_, i) => (
                    <i key={i} className={i < e.notes ? styles.fait : e.etat === "en_cours" && i === e.notes ? styles.aujourdhui : undefined} />
                  ))}
                </span>
              ) : null}
              <span className={styles.bas}>
                <span className={styles.ou}>{e.etat === "pas_commence" ? "Pas commencé" : e.jour && e.total ? `Jour ${e.jour} sur ${e.total}` : "En cours"}</span>
                <span className={styles.action}>{e.etat === "pas_commence" ? "Commencer" : "Reprendre"} →</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.vide}>Aucun exercice en cours. Le prochain arrive après ton contenu de la semaine.</div>
      )}

      {termines.length && ouvert ? (
        <div id="exercices-termines">
          {termines.map((e) => (
            <Link key={e.n} href={`/semaine/${e.n}/exercice`} className={styles.termine}>
              <span className={styles.termineNom}>{e.nom}</span>
              <span className={styles.termineDate}>{e.fin ? `terminé le ${dateCourte(e.fin)}` : "terminé"} · relire</span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
