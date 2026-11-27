"use client";

import { useEffect, useRef, useState } from "react";
import { noterDepuisLeNavigateur } from "../../actions";
import styles from "./guidage.module.css";

const temps = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/**
 * « Écouter le guidage » (brief V0.10, partie 5) : au-dessus de la consigne, dans la charte. Lecture et pause,
 * une barre qu'on peut déplacer, « Revenir de 15 secondes ». La lecture ne démarre jamais seule et continue écran
 * verrouillé (un simple élément audio). Tant que le vrai fichier n'est pas dans public/audio/, le navigateur passe
 * à l'enregistrement provisoire (seconde source), et la mention le dit, comme pour le podcast.
 */
export function Guidage({ n, cle, fichier, provisoire }: { n: number; cle: string; fichier: string; provisoire: string | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(0);
  const [estProvisoire, setEstProvisoire] = useState(false);
  const [indisponible, setIndisponible] = useState(false);
  const lance = useRef(false);

  // La durée et la source peuvent être connues avant que la page soit prête : on les relit une fois montée.
  const lire = (a: HTMLAudioElement) => {
    if (Number.isFinite(a.duration) && a.duration > 0) setDuree(a.duration);
    if (a.currentSrc) setEstProvisoire(Boolean(provisoire) && a.currentSrc.endsWith(provisoire!));
  };
  useEffect(() => {
    if (audio.current && audio.current.readyState >= 1) lire(audio.current);
  });

  if (indisponible) return null;
  return (
    <section className={styles.guidage} aria-labelledby="guidage-titre">
      <div className={styles.haut}>
        <h2 id="guidage-titre" className={styles.titre}>
          Écouter le guidage
        </h2>
        <span className={styles.duree}>{duree ? temps(duree) : ""}</span>
      </div>
      <audio
        ref={audio}
        preload="metadata"
        onLoadedMetadata={(e) => lire(e.currentTarget)}
        onDurationChange={(e) => lire(e.currentTarget)}
        onPlay={() => {
          setLecture(true);
          if (!lance.current) {
            lance.current = true;
            noterDepuisLeNavigateur("audio_lance", n, cle).catch(() => {});
          }
        }}
        onPause={() => setLecture(false)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onEnded={() => {
          setLecture(false);
          noterDepuisLeNavigateur("audio_termine", n, cle).catch(() => {});
        }}
      >
        {/* Le vrai fichier d'abord ; s'il manque, le navigateur passe à la source suivante. */}
        <source src={`/audio/${fichier}`} onError={provisoire ? undefined : () => setIndisponible(true)} />
        {provisoire ? <source src={provisoire} onError={() => setIndisponible(true)} /> : null}
      </audio>
      <div className={styles.commandes}>
        <button
          type="button"
          className={styles.lire}
          onClick={() => (audio.current?.paused ? audio.current?.play().catch(() => {}) : audio.current?.pause())}
          aria-label={lecture ? "Mettre en pause le guidage" : "Écouter le guidage"}
        >
          {lecture ? (
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8 4 20 12 8 20 8 4" />
            </svg>
          )}
        </button>
        <div className={styles.piste}>
          <input
            type="range"
            className={styles.barre}
            min={0}
            max={duree || 1}
            step={1}
            value={Math.min(position, duree || 1)}
            aria-label="Avancer dans le guidage"
            aria-valuetext={`${temps(position)} sur ${temps(duree)}`}
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
            }}
          />
          <div className={styles.temps}>
            <span>{temps(position)}</span>
            <span>{temps(duree)}</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.recul}
          onClick={() => {
            if (audio.current) audio.current.currentTime = Math.max(0, audio.current.currentTime - 15);
          }}
        >
          Revenir de 15 secondes
        </button>
      </div>
      <p className={styles.note} aria-live="polite">
        Guidé par Cloé{estProvisoire ? " · enregistrement provisoire" : ""}
        <span className="sr-only">{lecture ? ". Lecture en cours." : position > 0 ? ". En pause." : ""}</span>
      </p>
    </section>
  );
}
