import styles from "./CestNote.module.css";

/**
 * « C'est noté. » avec une coche qui se dessine (300 ms), à la place du bouton qui vient d'enregistrer (brief V0.8).
 * `anime` : seulement quand ça vient d'être enregistré, pas à l'ouverture de la page.
 */
export function CestNote({ texte = "C'est noté.", suite, anime = true, className }: { texte?: string; suite?: string; anime?: boolean; className?: string }) {
  return (
    <span className={`${styles.note} ${anime ? styles.anime : ""} ${className ?? ""}`} role="status">
      <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" className={styles.coche}>
        <circle cx="9" cy="9" r="8" />
        <path d="M5 9.3 7.8 12 13 6.4" pathLength={1} />
      </svg>
      <span>
        <strong>{texte}</strong>
        {suite ? ` ${suite}` : null}
      </span>
    </span>
  );
}
