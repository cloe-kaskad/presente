"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Curseur } from "@/components/Curseur";
import { Marque } from "@/components/Marque";
import { CURSEUR_PAR_DEFAUT, apercuTroisQuetes, type Positions } from "@/lib/chemin/calcul";
import { departageParMots } from "@/lib/chemin/lecture-mots";
import { CURSEUR_ENVIE, QUETE, QUETES, type QueteId } from "@/lib/questionnaire/contenu";
import { garderCeChemin } from "../actions";
import styles from "./echanger.module.css";

export function Echanger({
  positionsInitiales,
  appelle,
  actuel,
}: {
  positionsInitiales: Positions;
  appelle: string;
  actuel: QueteId[];
}) {
  // Un curseur jamais touché compte pour 3 : on l'affiche ainsi.
  const [positions, setPositions] = useState<Positions>(() =>
    Object.fromEntries(
      QUETES.map((q) => [
        q,
        { ou: positionsInitiales[q]?.ou ?? CURSEUR_PAR_DEFAUT, envie: positionsInitiales[q]?.envie ?? CURSEUR_PAR_DEFAUT },
      ]),
    ),
  );
  const [enCours, demarrer] = useTransition();
  const [touche, setTouche] = useState(false);
  const router = useRouter();

  // Tant qu'elle n'a rien bougé, on montre son chemin tel qu'il est.
  const calcule = useMemo(
    () => apercuTroisQuetes(positions, (egales) => (appelle.trim() ? departageParMots(appelle, egales) : null)),
    [positions, appelle],
  );
  const propose = touche ? calcule : actuel;
  const change = propose.some((q, i) => q !== actuel[i]);

  const bouger = (q: QueteId, cle: "ou" | "envie", v: number) => {
    setTouche(true);
    setPositions((p) => ({ ...p, [q]: { ...p[q], [cle]: v } }));
  };

  // Rien bougé : on garde le chemin tel quel.
  const garder = () => {
    if (!touche) router.push("/carte");
    else demarrer(() => garderCeChemin(positions));
  };

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <span className={styles.marqueOrdi}>
          <Marque couleur="rouge" />
        </span>
        <Link href="/carte" className={styles.retour}>
          ← Ma carte
        </Link>
      </header>

      <div className={styles.grille}>
        <section className={styles.gauche}>
          <h1 className={styles.titre}>Ajuste, et ton chemin se recompose.</h1>
          <p className={styles.texte}>
            Voici tes réponses sur les sept quêtes. Bouge un curseur : les trois quêtes proposées se mettent à jour.
          </p>
          <span className={styles.etiquette} id="pour-l-instant">
            Ton chemin, pour l&apos;instant
          </span>
          <ul className={styles.puces} aria-labelledby="pour-l-instant" aria-live="polite">
            {propose.map((q, i) => (
              <li key={q} className={styles.puce}>
                <span className={styles.puceMois}>Mois {i + 1}</span>
                {QUETE[q].nom}
              </li>
            ))}
          </ul>
          {change ? <p className={styles.note}>Ton chemin changera : on réécrira ta carte.</p> : null}
          <div className={styles.boutonOrdi}>
            <button type="button" className="bouton bouton--grand" onClick={garder} disabled={enCours}>
              {enCours ? "On recompose ton chemin…" : "Garder ce chemin"}
            </button>
          </div>
        </section>

        <section className={styles.quetes} aria-label="Tes sept quêtes">
          {QUETES.map((q) => {
            const mois = propose.indexOf(q);
            return (
              <div key={q} className={styles.quete}>
                <div className={styles.queteHaut}>
                  <h2 className={`titre-nom ${styles.nom}`}>{QUETE[q].nom}</h2>
                  {mois >= 0 ? <span className={styles.mois}>Mois {mois + 1}</span> : null}
                </div>
                <Curseur
                  nom={`${q}-ou`}
                  legende="Où j'en suis"
                  valeur={positions[q]?.ou}
                  onChange={(v) => bouger(q, "ou", v)}
                  gauche={QUETE[q].gauche}
                  droite={QUETE[q].droite}
                />
                <Curseur
                  nom={`${q}-envie`}
                  legende={CURSEUR_ENVIE.question}
                  valeur={positions[q]?.envie}
                  onChange={(v) => bouger(q, "envie", v)}
                  gauche={CURSEUR_ENVIE.gauche.toLowerCase()}
                  droite={CURSEUR_ENVIE.droite.toLowerCase()}
                />
              </div>
            );
          })}
        </section>
      </div>

      <footer className={styles.pied}>
        <button type="button" className="bouton bouton--grand" onClick={garder} disabled={enCours}>
          {enCours ? "On recompose ton chemin…" : "Garder ce chemin"}
        </button>
      </footer>
    </div>
  );
}
