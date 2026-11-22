"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import m from "@/components/mouvement.module.css";
import { TEXTES_A_DEUX as T } from "@/lib/buddy/textes";
import styles from "./duo.module.css";

/** Les deux voies parallèles, qui ne se croisent jamais (maquette Duo-A) : sur la page de proposition seulement. */
function DeuxVoies({ grand }: { grand?: boolean }) {
  const [w, h] = grand ? [560, 240] : [342, 78];
  const y = grand ? [228, 60, 180, 12] : [66, 34, 44, 12];
  const c1 = grand ? [235.2, 324.8] : [143.6, 198.4];
  const voie = (y0: number, y1: number) => `M 12 ${y0} C ${c1[0]} ${y0} ${c1[1]} ${y1} ${w - 12} ${y1}`;
  const points = (y0: number, y1: number) =>
    [0, 0.36, 0.64, 1].map((t) => {
      const u = 1 - t;
      const x = u ** 3 * 12 + 3 * u * u * t * c1[0] + 3 * u * t * t * c1[1] + t ** 3 * (w - 12);
      const yy = u ** 3 * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t ** 3 * y1;
      return [x, yy];
    });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={grand ? styles.voiesGrand : styles.voies} role="img" aria-label="Deux voies qui avancent côte à côte">
      <path d={voie(y[0], y[1])} pathLength={1} className={`${m.trace} ${styles.voie}`} stroke="#ffffff" style={{ animationDuration: "2.2s" }} />
      <path d={voie(y[2], y[3])} pathLength={1} className={`${m.trace} ${styles.voie}`} stroke="var(--rose)" style={{ animationDuration: "2.2s", animationDelay: "0.15s" }} />
      {points(y[0], y[1]).map(([x, yy], i) => (
        <circle key={`a${i}`} className={m.pt} cx={x} cy={yy} r={5.5} fill="#ffffff" style={{ animationDelay: `${0.3 + i * 0.5}s` }} />
      ))}
      {points(y[2], y[3]).map(([x, yy], i) => (
        <circle key={`b${i}`} className={m.pt} cx={x} cy={yy} r={5.5} fill="var(--rose)" style={{ animationDelay: `${0.42 + i * 0.5}s` }} />
      ))}
    </svg>
  );
}

const TEMPS = [
  { titre: "On te présente une femme", texte: "En chemin depuis aussi longtemps que toi, sur la même quête si possible." },
  { titre: "Une question par semaine", texte: "La même pour vous deux. Tu lis sa réponse dès que tu as donné la tienne." },
  { titre: "Juste vos mots", texte: "Ni messagerie, ni numéro. Chaque mois, vous choisissez de continuer." },
];
const EN_SAVOIR_PLUS = [
  "Les questions vont un peu plus loin de mois en mois.",
  "À la fin de ton chemin, si vous le voulez toutes les deux, vous pourrez vous écrire en dehors.",
  "Tu peux arrêter quand tu veux, sans avoir à t'expliquer.",
];

/** « Un bout de chemin à deux » (maquettes Duo-A, Duo-A-plus, D-Duo-A) : une accroche, deux voies, trois temps. */
export function Proposition({ actions }: { actions: ReactNode }) {
  return (
    <div className={styles.proposition}>
      <section className={styles.haut}>
        <div className={styles.hautTexte}>
          <h1 className={styles.titre}>{T.titre}.</h1>
          <p className={styles.accroche}>Savoir qu&apos;une autre avance en même temps que toi, et lire comment elle s&apos;y prend.</p>
        </div>
        <DeuxVoies />
        <DeuxVoies grand />
      </section>
      <section className={styles.bas}>
        {TEMPS.map((t) => (
          <div key={t.titre} className={styles.temps}>
            <span className={styles.tempsTitre}>{t.titre}</span>
            <span className={styles.tempsTexte}>{t.texte}</span>
          </div>
        ))}
        <details className={styles.plus}>
          <summary>En savoir plus</summary>
          <ul className={m.deplie}>
            {EN_SAVOIR_PLUS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>
        <div className={styles.boutons}>{actions}</div>
      </section>
    </div>
  );
}

/** Les deux boules : la sienne, pleine, avec son initiale ; l'autre, un anneau en pointillé qui respire (ou pleine, trouvée). */
export function DeuxBoules({
  initiale,
  autre,
  taille = "moyen",
  animer = true,
  flotter = animer,
  clair = false,
}: {
  initiale: string;
  autre?: string | null;
  taille?: "petit" | "ligne" | "carte" | "moyen" | "grand";
  animer?: boolean;
  flotter?: boolean;
  /** Sur fond blanc (la ligne « On cherche… » de Mon chemin) : sa boule rouge, l'anneau bordeaux. */
  clair?: boolean;
}) {
  const sansInitiale = taille === "petit" || taille === "ligne";
  return (
    <span className={`${styles.boules} ${styles[taille]} ${clair ? styles.clair : ""}`} role="img" aria-label={autre ? "Toi et elle" : "Toi, et une place qui attend"}>
      <span className={flotter ? styles.flotte : undefined}>
        <span className={`${styles.boule} ${styles.pleine} ${animer ? m.pt : ""}`} style={{ animationDelay: "0.2s" }}>
          {sansInitiale ? "" : initiale}
        </span>
      </span>
      <span className={flotter ? styles.flotte : undefined} style={{ animationDelay: "-1.6s" }}>
        {autre ? (
          <span className={`${styles.boule} ${styles.pleine} ${styles.autre} ${animer ? m.pt : ""}`} style={{ animationDelay: "0.55s" }}>
            {sansInitiale ? "" : autre}
          </span>
        ) : (
          <span className={`${styles.boule} ${styles.attend} ${animer ? m.pt : ""}`} style={{ animationDelay: "0.9s" }} />
        )}
      </span>
    </span>
  );
}

/**
 * L'attente (maquettes Duo-cherche, Duo-attente, D-Duo-attente) : plein écran, sa boule arrive, puis l'anneau de l'autre,
 * puis le message et un seul bouton. « Mouvement réduit » : pas d'animation, le message s'affiche tout de suite.
 */
export function Attente({ initiale }: { initiale: string }) {
  return (
    <div className={styles.attente} role="status">
      <div className={styles.attenteBoules}>
        <DeuxBoules initiale={initiale} taille="grand" />
      </div>
      <div className={`${styles.attenteTexte} ${m.monte}`} style={{ animationDelay: "1.6s" }}>
        <h1 className={styles.attenteTitre}>{T.onCherche}</h1>
        <p className={styles.attenteMessage}>Ça prend en général 24 heures. On te prévient dès qu&apos;on l&apos;a trouvée.</p>
        <span className={styles.signe}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7.2" fill="none" stroke="#fff" strokeWidth="1.6" />
            <circle cx="10" cy="10" r="2.6" fill="#fff" />
          </svg>
          Un signe en haut de Mon chemin
        </span>
        <span className={styles.test}>Phase de test : la recherche est simulée.</span>
      </div>
      <div className={`${styles.attenteBouton} ${m.monte}`} style={{ animationDelay: "1.9s" }}>
        <Link href="/chemin" className="bouton bouton--blanc">
          Retour à mon chemin
        </Link>
      </div>
    </div>
  );
}
