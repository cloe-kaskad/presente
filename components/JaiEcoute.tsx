"use client";

import { useState, useTransition } from "react";
import { marquerEcoute, noterDepuisLeNavigateur } from "@/app/semaine/actions";
import { dateEnLettres, jourAParis } from "@/lib/rituel/citations";
import { motsEcoute } from "@/lib/semaines/ecoute";
import styles from "./JaiEcoute.module.css";

/**
 * « Écouter » et « J'ai écouté » sur la carte du contenu (maquettes Contenu-avant et Contenu-apres, V0.9).
 * Une fois dit : la pastille « ✓ Écouté le 16 novembre » (on annule en recliquant dessus) et « Réécouter ».
 */
export function JaiEcoute({
  n,
  format,
  lien,
  verbe,
  initial,
  onFait,
  fond = "rouge",
}: {
  n: number;
  format: string | null;
  /** Le lien du contenu ; sans lien (épisode de monde), pas de bouton « Écouter ». */
  lien: string | null;
  verbe: string;
  initial: number | null;
  onFait?: () => void;
  /** « rouge » : sur la carte rouge du contenu. « clair » : sur un fond clair (épisode de monde). */
  fond?: "rouge" | "clair";
}) {
  const [le, setLe] = useState<number | null>(initial);
  const [anime, setAnime] = useState(false);
  const [, demarrer] = useTransition();
  const mots = motsEcoute(format);
  const date = le ? dateEnLettres(jourAParis(new Date(le * 1000))).replace(/^\S+ /, "") : "";

  const changer = (fait: boolean) => {
    // On affiche tout de suite ; le serveur suit.
    setLe(fait ? Math.floor(Date.now() / 1000) : null);
    setAnime(fait);
    if (fait) onFait?.();
    demarrer(async () => {
      const r = await marquerEcoute(n, fait).catch(() => null);
      if (r?.ok && fait) setLe(r.le);
    });
  };

  const lienContenu = (texte: string, classe: string) =>
    lien ? (
      <a href={lien} target="_blank" rel="noopener noreferrer" className={classe} onClick={() => void noterDepuisLeNavigateur("contenu_ouvert", n).catch(() => null)}>
        {texte}
        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
      </a>
    ) : null;

  return le ? (
    <span className={`${styles.ligne} ${fond === "clair" ? styles.clair : ""}`}>
      <button type="button" className={styles.pastille} onClick={() => changer(false)} aria-label={`${mots.le} ${date}. Annuler`}>
        <span className={styles.rond} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M4.2 8.3 6.9 11 11.8 5.6" pathLength={1} className={anime ? styles.coche : undefined} />
          </svg>
        </span>
        {mots.le} {date}
      </button>
      {lienContenu(mots.encore, styles.encore)}
    </span>
  ) : (
    <span className={`${styles.ligne} ${fond === "clair" ? styles.clair : ""}`}>
      {lienContenu(verbe, `${styles.bouton} ${styles.plein}`)}
      <button type="button" className={`${styles.bouton} ${styles.contour}`} onClick={() => changer(true)}>
        {mots.fait}
      </button>
    </span>
  );
}
