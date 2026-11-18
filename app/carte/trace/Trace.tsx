"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Marque } from "@/components/Marque";
import { ecrireMaCarte } from "../actions";
import styles from "./trace.module.css";

const ETAPES = [
  "On relit ce que tu as écrit.",
  "On choisit tes trois quêtes.",
  "On cherche les mondes qui éclairent ton histoire.",
  "On prépare tes exercices et tes gestes.",
];
/** Secondes auxquelles chaque étape se termine ; la dernière attend que le moteur ait fini. */
const FIN_ETAPE = [5, 11, 18];
const DUREE_MIN = 22;
const DUREE_ATTENDUE = 50;

const CHEMIN = "M 14 216 C 186.7 210.0 155.3 28.0 328 24";
const POINTS = [
  { x: 14, y: 216, r: 7, seuil: 0 },
  { x: 96.4, y: 194.1, r: 5.5, seuil: 0.18 },
  { x: 149.4, y: 147, r: 5.5, seuil: 0.38 },
  { x: 192.6, y: 91.6, r: 5.5, seuil: 0.58 },
  { x: 245.6, y: 44.9, r: 5.5, seuil: 0.78 },
];

export function Trace({ prenom, citation }: { prenom: string | null; citation: string | null }) {
  const router = useRouter();
  const [secondes, setSecondes] = useState(0);
  const [fini, setFini] = useState<null | "ok" | "secours">(null);
  const lance = useRef(false);

  useEffect(() => {
    const debut = Date.now();
    const t = setInterval(() => setSecondes((Date.now() - debut) / 1000), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (lance.current) return;
    lance.current = true;
    ecrireMaCarte()
      .then((r) => {
        if ("detresse" in r) router.replace("/quand-ca-ne-va-pas");
        else setFini(r.ok ? "ok" : "secours");
      })
      .catch(() => setFini("secours"));
  }, [router]);

  const termine = fini !== null && secondes >= DUREE_MIN;
  const etapeCourante = termine ? 4 : Math.min(3, FIN_ETAPE.filter((f) => secondes >= f).length);
  const progression = termine ? 1 : Math.min(0.92, secondes / DUREE_ATTENDUE);

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Marque />
      </header>
      <main className={styles.corps}>
        <div className={styles.dessin}>
          <svg viewBox="0 0 342 230" role="img" aria-label={termine ? "Ton chemin est tracé" : "Ton chemin se dessine"}>
            <path d={CHEMIN} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
            <path
              className={styles.trait}
              d={CHEMIN}
              pathLength={1}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - progression }}
            />
            {POINTS.map((p) => (
              <circle key={p.x} cx={p.x} cy={p.y} r={p.r} fill="#ffffff" className={styles.point} style={{ opacity: progression >= p.seuil ? 1 : 0.35 }} />
            ))}
            <circle
              cx="328"
              cy="24"
              r="10"
              fill={termine ? "#ffffff" : "none"}
              stroke="#ffffff"
              strokeWidth="2"
              className={styles.point}
              style={{ opacity: termine ? 1 : 0.35 }}
            />
          </svg>
        </div>
        <div className={styles.texte}>
          <h1 className={styles.titre}>{prenom ? `${prenom}, on trace ton chemin.` : "On trace ton chemin."}</h1>
          <ol className={styles.etapes} aria-live="polite">
            {ETAPES.map((e, i) => {
              const etat = i < etapeCourante ? "faite" : i === etapeCourante ? "en_cours" : "a_venir";
              return (
                <li key={e} className={`${styles.etape} ${styles[etat]}`}>
                  <span className={styles.pastille} aria-hidden="true">
                    {etat === "faite" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : etat === "en_cours" ? (
                      <span className={styles.rond} />
                    ) : null}
                  </span>
                  <span>
                    {e}
                    {i === 0 && citation && etat !== "a_venir" ? (
                      <span className={styles.citation}>
                        <span className="ses-mots ses-mots--blanc">« {citation} »</span>
                      </span>
                    ) : null}
                    <span className="sr-only">{etat === "faite" ? " (fait)" : etat === "en_cours" ? " (en cours)" : ""}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className={`${styles.bouton} ${termine ? styles.boutonVisible : ""}`}>
            {termine ? (
              <a href={fini === "ok" ? "/carte" : "/carte?secours=1"} className="bouton bouton--blanc bouton--grand">
                Découvrir mon chemin
              </a>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
