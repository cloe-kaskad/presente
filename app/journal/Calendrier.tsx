"use client";

import { useState } from "react";
import { couleurDe } from "@/lib/rituel/humeurs";
import m from "@/components/mouvement.module.css";
import styles from "./journal.module.css";

type Jour = { jour: string; humeur: string; note: string };

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

/** Le mois, une pastille par jour ; toucher un jour montre sa phrase. */
export function Calendrier({ debutDuMois, aujourdhui, jours }: { debutDuMois: string; aujourdhui: string; jours: Jour[] }) {
  const [choisi, setChoisi] = useState<string | null>(null);
  const parJour = new Map(jours.map((j) => [j.jour, j]));
  const premier = new Date(`${debutDuMois}T12:00:00Z`);
  const decalage = (premier.getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(premier.getUTCFullYear(), premier.getUTCMonth() + 1, 0)).getUTCDate();
  const cellules = Array.from({ length: nbJours }, (_, i) => `${debutDuMois.slice(0, 8)}${String(i + 1).padStart(2, "0")}`);
  const nomJour = (j: string) =>
    new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${j}T12:00:00Z`));
  const detail = choisi ? parJour.get(choisi) : null;

  return (
    <div>
      <div className={styles.calendrier} role="grid" aria-label="Ton mois">
        {JOURS.map((j, i) => (
          <span key={i} className={styles.entete} aria-hidden="true">
            {j}
          </span>
        ))}
        {Array.from({ length: decalage }, (_, i) => (
          <span key={`v${i}`} aria-hidden="true" />
        ))}
        {cellules.map((j, i) => {
          const h = parJour.get(j);
          const n = Number(j.slice(8));
          // Les pastilles apparaissent en vague, jour après jour (15 ms d'écart).
          const vague = { animationDelay: `${i * 15}ms` };
          // Un mot à elle : case blanche, bord bordeaux, chiffre bordeaux.
          const c = h ? couleurDe(h.humeur) : null;
          const style = c ? { background: c.fond, color: c.texte, ...(c.bord ? { border: `1.5px solid ${c.bord}` } : {}), ...vague } : vague;
          const classe = `${m.vague} ${styles.jour} ${h ? styles.note : styles.vide} ${j === aujourdhui ? styles.aujourdhui : ""} ${choisi === j ? styles.choisi : ""}`;
          return h ? (
            <button
              key={j}
              type="button"
              className={classe}
              style={style}
              title={h.note ? `${h.humeur} · ${h.note}` : h.humeur}
              aria-label={`${nomJour(j)} : ${h.humeur}${h.note ? `. ${h.note}` : ""}`}
              aria-pressed={choisi === j}
              onClick={() => setChoisi(choisi === j ? null : j)}
            >
              {n}
            </button>
          ) : j === aujourdhui ? (
            // Aujourd'hui, rien de noté : la case ramène à la carte « Comment tu vas » en haut de la page.
            <a
              key={j}
              href="#comment-tu-vas"
              className={`${classe} ${styles.aujourdhuiVide}`}
              aria-label={`${nomJour(j)}, aujourd'hui : rien de noté. Noter ma journée`}
              onClick={(e) => {
                const carte = document.getElementById("comment-tu-vas");
                if (!carte) return;
                e.preventDefault();
                carte.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                carte.focus({ preventScroll: true });
              }}
            >
              {n}
            </a>
          ) : (
            <span key={j} className={classe} aria-label={`${nomJour(j)} : rien de noté`}>
              {n}
            </span>
          );
        })}
      </div>
      <p className={styles.detail} aria-live="polite">
        {detail ? (
          <>
            <strong>
              {nomJour(detail.jour)} · {detail.humeur}
            </strong>
            {detail.note ? ` · « ${detail.note} »` : ""}
          </>
        ) : null}
      </p>
    </div>
  );
}
