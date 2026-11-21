import type { CSSProperties } from "react";
import { BarreEspace } from "./BarreEspace";
import { CitationSiLent } from "./CitationSiLent";
import styles from "./EnAttente.module.css";

/** Un bloc rose grisé, à la forme de ce qui arrive. */
function B({ l = "100%", h = 12, r, blanc, style }: { l?: string | number; h?: number; r?: number; blanc?: boolean; style?: CSSProperties }) {
  return <i className={`${styles.bloc} ${blanc ? styles.blanc : ""}`} style={{ width: l, height: h, borderRadius: r, ...style }} />;
}

type Forme = "chemin" | "journal" | "semaine";

/**
 * Une page qui charge (maquette Attente-page) : la barre du menu reste, et la page montre
 * sa propre structure en attente. Si l'attente dure, une citation apparaît.
 */
export function PageEnAttente({ forme }: { forme: Forme }) {
  return (
    <div className={styles.page}>
      <BarreEspace courante={forme === "journal" ? "journal" : "chemin"} />
      {/* Si la page tarde, une citation prend le relais du squelette. */}
      <CitationSiLent />
      <main aria-busy="true" className={styles.corps}>
        <span className="sr-only">La page se charge.</span>
        {forme === "chemin" ? (
          <>
            <B h={124} r={24} />
            <B l="38%" h={22} />
            <div className={styles.grille}>
              <B h={150} r={24} />
              <B h={150} r={24} />
              <B h={150} r={24} />
            </div>
            <div className={styles.carteRose}>
              <B l="52%" h={22} />
              <B l="86%" />
              <B h={84} r={14} blanc />
            </div>
          </>
        ) : forme === "journal" ? (
          <>
            <B l="38%" h={14} />
            <B l="60%" h={36} />
            <B h={260} r={24} />
            <div className={styles.carteBord}>
              <B l="44%" h={20} />
              <B l="90%" />
              <B l="70%" />
            </div>
          </>
        ) : (
          <>
            <B l="38%" h={14} />
            <B h={124} r={24} />
            <div className={styles.carteRose}>
              <B l="52%" h={22} />
              <B l="86%" />
              <B h={84} r={14} blanc />
              <B h={50} r={14} blanc />
            </div>
            <div className={styles.carteBord}>
              <B l="44%" h={20} />
              <span className={styles.ligne}>
                <B l={96} h={38} r={999} />
                <B l={72} h={38} r={999} />
                <B l={120} h={38} r={999} />
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
