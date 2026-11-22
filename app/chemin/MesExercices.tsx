"use client";

import Link from "next/link";
import { useState } from "react";
import m from "@/components/mouvement.module.css";
import { prochaineAction, type ExerciceDuChemin } from "@/lib/semaines/exercice";
import styles from "./exercices.module.css";

const dateCourte = (jour: string) =>
  new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

/** L'anneau d'avancement : fond blanc, arc rouge profond, « 2/7 » au centre (maquettes V0.8). */
function Anneau({ fait, total }: { fait: number; total: number }) {
  const t = 64;
  const r = 27;
  const reste = Math.max(0, Math.min(1, 1 - fait / total));
  return (
    <span className={styles.anneau}>
      <svg viewBox={`0 0 ${t} ${t}`} aria-hidden="true">
        <circle cx={t / 2} cy={t / 2} r={r} fill="none" stroke="#ffffff" strokeWidth="6" />
        {fait > 0 ? (
        <circle
          className={m.anneau}
          cx={t / 2}
          cy={t / 2}
          r={r}
          pathLength={1}
          fill="none"
          stroke="var(--rouge-profond)"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ strokeDashoffset: reste }}
        />
        ) : null}
      </svg>
      <span className={styles.anneauTexte}>
        {fait}/{total}
      </span>
    </span>
  );
}

/** « Mes exercices en cours » (maquettes Chemin, D-Chemin, Exercices-etats et D-Exercices-etats, V0.8). */
export function MesExercices({ exercices }: { exercices: ExerciceDuChemin[] }) {
  const [ouvert, setOuvert] = useState(false);
  const enCours = exercices.filter((e) => e.etat !== "termine");
  const termines = exercices.filter((e) => e.etat === "termine");
  const seul = enCours.length === 1;

  return (
    <section className={styles.zone} aria-labelledby="mes-exercices">
      <div className={styles.haut}>
        <h2 id="mes-exercices" className={styles.titre}>
          {seul ? "Ton exercice en cours." : "Mes exercices en cours."}
        </h2>
        {termines.length ? (
          <button type="button" className={styles.lienTermines} aria-expanded={ouvert} aria-controls="exercices-termines" onClick={() => setOuvert(!ouvert)}>
            Exercices terminés ({termines.length}) {ouvert ? "▴" : "▾"}
          </button>
        ) : null}
      </div>

      {enCours.length ? (
        <div className={`${styles.grille} ${seul ? styles.seul : ""}`} style={{ ["--colonnes" as string]: Math.min(3, enCours.length) }}>
          {enCours.map((e, i) => {
            const total = e.total ?? 1;
            const fait = e.total ? e.notes : 0;
            const ou = e.etat === "pas_commence" ? "pas commencé" : e.jour && e.total ? `jour ${e.jour} sur ${e.total}` : "en cours";
            const surtitre = [e.agir ? "Geste" : "Exercice", e.rythme?.toLowerCase(), ou].filter(Boolean).join(" · ");
            return (
              <Link
                key={e.n}
                href={`/semaine/${e.n}/exercice`}
                className={`${styles.carte} ${m.monte} ${m.carte}`}
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                <span className={styles.carteHaut}>
                  <Anneau fait={fait} total={total} />
                  <span className={styles.carteTexte}>
                    <span className={styles.surtitre}>{surtitre}</span>
                    <span className={styles.nom}>{e.nom}</span>
                    <span className={styles.action}>
                      <i className={`${styles.point} ${m.pouls}`} aria-hidden="true" />
                      {prochaineAction(e)}
                    </span>
                  </span>
                </span>
                <span className={styles.bouton}>{e.etat === "pas_commence" ? "Commencer" : "Reprendre"}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.vide}>Aucun exercice en cours. Le prochain arrive après ton contenu de la semaine.</div>
      )}

      {termines.length && ouvert ? (
        <div id="exercices-termines" className={`${styles.liste} ${m.deplie}`}>
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
