"use client";

import { useEffect, useState } from "react";
import { Mantra } from "./Mantra";
import styles from "./CitationSiLent.module.css";

/**
 * Une citation, seulement si l'attente dure : rien pendant les premiers instants (le squelette suffit),
 * puis l'écran à grain avec une phrase de femme (demande de Cloé, novembre 2026).
 */
export function CitationSiLent({ delai = 700 }: { delai?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delai);
    return () => clearTimeout(t);
  }, [delai]);
  if (!visible) return null;
  return (
    <div className={styles.voile}>
      <Mantra />
    </div>
  );
}
