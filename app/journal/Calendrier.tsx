"use client";

import { useState } from "react";
import { COULEUR, type Humeur } from "@/lib/rituel/humeurs";
import styles from "./journal.module.css";

type Jour = { jour: string; humeur: Humeur; note: string };

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
        {cellules.map((j) => {
          const h = parJour.get(j);
          const n = Number(j.slice(8));
          const style = h ? { background: COULEUR[h.humeur].fond, color: COULEUR[h.humeur].texte } : undefined;
          const classe = `${styles.jour} ${h ? styles.note : styles.vide} ${j === aujourdhui ? styles.aujourdhui : ""} ${choisi === j ? styles.choisi : ""}`;
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
