"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./vivre.module.css";

const FICHIER = "/audio/provisoire.mp3";

function temps(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Le lecteur d'un épisode : lecture, pause, plus et moins 15 secondes, reprise là où elle s'est arrêtée. */
export function Lecteur({ cle, titre, monde, onFin }: { cle: string; titre: string; monde: string; onFin: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(0);
  const memo = `presente:episode:${cle}`;

  // Reprendre là où elle s'était arrêtée (mémorisé sur cet appareil seulement).
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const reprendre = () => {
      setDuree(a.duration);
      try {
        const t = Number(localStorage.getItem(memo));
        if (t > 0 && t < a.duration - 2) a.currentTime = t;
      } catch {}
    };
    a.addEventListener("loadedmetadata", reprendre);
    return () => a.removeEventListener("loadedmetadata", reprendre);
  }, [memo]);

  const bouger = (d: number) => {
    const a = audio.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + d));
  };

  return (
    <div className={styles.lecteur}>
      <span className={styles.lecteurMonde}>
        <span aria-hidden="true">/</span> Monde · {monde}
      </span>
      <h2 className={styles.lecteurTitre}>{titre}</h2>
      <audio
        ref={audio}
        src={FICHIER}
        preload="metadata"
        onPlay={() => setLecture(true)}
        onPause={() => setLecture(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setPosition(t);
          try {
            localStorage.setItem(memo, String(t));
          } catch {}
        }}
        onEnded={() => {
          try {
            localStorage.removeItem(memo);
          } catch {}
          onFin();
        }}
      />
      <input
        type="range"
        className={styles.barre}
        min={0}
        max={duree || 1}
        step={1}
        value={position}
        aria-label="Avancer dans l'épisode"
        aria-valuetext={`${temps(position)} sur ${temps(duree)}`}
        onChange={(e) => {
          if (audio.current) audio.current.currentTime = Number(e.target.value);
        }}
      />
      <div className={styles.temps}>
        <span>{temps(position)}</span>
        <span>{temps(duree)}</span>
      </div>
      <div className={styles.commandes}>
        <button type="button" className={styles.saut} onClick={() => bouger(-15)} aria-label="Reculer de 15 secondes">
          -15
        </button>
        <button
          type="button"
          className={styles.lire}
          onClick={() => (audio.current?.paused ? audio.current?.play() : audio.current?.pause())}
          aria-label={lecture ? "Pause" : "Lecture"}
        >
          {lecture ? (
            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="7 4 20 12 7 20 7 4" />
            </svg>
          )}
        </button>
        <button type="button" className={styles.saut} onClick={() => bouger(15)} aria-label="Avancer de 15 secondes">
          +15
        </button>
      </div>
      <span className={styles.lecteurNote}>Podcast original Présente! · enregistrement provisoire</span>
    </div>
  );
}
