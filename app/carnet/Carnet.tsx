"use client";

import { useMemo, useState } from "react";
import { dateDeNote, periode, type Categorie, type SemaineDuCarnet } from "@/lib/semaines/fil-du-carnet";
import m from "@/components/mouvement.module.css";
import styles from "./carnet.module.css";

type Filtre = "tout" | Categorie | "debut";
const FILTRES: { id: Filtre; label: string }[] = [
  { id: "tout", label: "Tout" },
  { id: "contenus", label: "Contenus" },
  { id: "exercices", label: "Exercices" },
  { id: "jour", label: "Questions du jour" },
  { id: "debut", label: "Au début" },
];

const sans = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Mon carnet (maquettes Carnet et D-Carnet) : un fil daté, le plus récent en haut. */
export function Carnet({ semaines, debut }: { semaines: SemaineDuCarnet[]; debut: { question: string; reponse: string }[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [debutOuvert, setDebutOuvert] = useState(false);
  const r = sans(recherche.trim());

  const visibles = useMemo(() => {
    if (filtre === "debut") return [];
    return semaines
      .map((s) => ({
        ...s,
        notes: s.notes.filter(
          (n) => (filtre === "tout" || n.categorie === filtre) && (!r || sans(`${n.origine} ${n.lignes.map((l) => `${l.question} ${l.reponse}`).join(" ")}`).includes(r)),
        ),
      }))
      .filter((s) => s.notes.length);
  }, [semaines, filtre, r]);
  const debutVisible = filtre === "tout" || filtre === "debut" ? debut.filter((l) => !r || sans(`${l.question} ${l.reponse}`).includes(r)) : [];
  const debutDeplie = filtre === "debut" || debutOuvert || Boolean(r);
  const vide = !semaines.length && !debut.length;
  const rien = !vide && !visibles.length && !debutVisible.length;

  return (
    <main className={styles.page}>
      <div className={styles.entete}>
        <div className={styles.titreLigne}>
          <h1 className={styles.titre}>Carnet</h1>
          <a href="/carnet/telecharger" className={`${styles.telecharger} ${styles.telTel}`}>
            Télécharger
          </a>
        </div>
        <div className={styles.outils}>
          <p className={styles.intro}>Tout ce que tu écris en chemin vient se ranger ici, le plus récent en haut. C&apos;est en te relisant que tu verras ce qui a bougé.</p>
          <div className={styles.rechercheLigne}>
            <label htmlFor="recherche" className="sr-only">
              Chercher dans mon carnet
            </label>
            <input id="recherche" type="search" className={styles.recherche} placeholder="Chercher un mot, une personne…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            <a href="/carnet/telecharger" className={`${styles.telecharger} ${styles.telOrdi}`}>
              Télécharger
            </a>
          </div>
          <div className={styles.filtres} role="group" aria-label="Filtrer mon carnet">
            {FILTRES.map((f) => (
              <button key={f.id} type="button" className={styles.filtre} aria-pressed={filtre === f.id} onClick={() => setFiltre(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {vide ? (
        <p className={styles.vide}>Ton carnet est encore vide. Tout ce que tu écris en chemin viendra s&apos;y ranger.</p>
      ) : rien ? (
        <p className={styles.vide} role="status">
          Rien ne correspond.{" "}
          <button
            type="button"
            className={styles.lien}
            onClick={() => {
              setRecherche("");
              setFiltre("tout");
            }}
          >
            Tout afficher
          </button>
        </p>
      ) : null}

      {visibles.map((s) => (
        <section key={s.n} className={styles.semaine} aria-labelledby={`semaine-${s.n}`}>
          <div className={styles.semaineTete}>
            {s.cetteSemaine ? <span className={styles.cette}>Cette semaine</span> : null}
            <h2 id={`semaine-${s.n}`} className={styles.semaineTitre}>
              {s.titre}
            </h2>
            <span className={styles.semaineInfo}>
              {periode(s.premier, s.dernier)} · {s.notes.length} note{s.notes.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className={styles.feuille}>
            {s.notes.map((n, i) => (
              // Les notes de la semaine en cours montent en cascade (60 ms d'écart, six premières seulement).
              <article
                key={n.cle}
                className={`${styles.note} ${s.cetteSemaine && i < 6 ? m.monte : ""}`}
                style={s.cetteSemaine && i < 6 ? { animationDelay: `${i * 60}ms` } : undefined}
              >
                <span className={styles.date}>
                  <span className={styles.dateTel}>{dateDeNote(n.jour)}</span>
                  <span className={styles.dateOrdi}>{dateDeNote(n.jour, true)}</span>
                </span>
                <div className={styles.noteCorps}>
                  <div className={styles.origineLigne}>
                    <span className={styles.origine}>{n.origine}</span>
                    {n.pastille ? <span className={styles.pastille}>{n.pastille}</span> : null}
                  </div>
                  {n.lignes.map((l, i) => (
                    <div key={i} className={styles.ligne}>
                      <span className={styles.question}>{l.question}</span>
                      <p className={styles.reponse}>{l.reponse}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {debutVisible.length ? (
        <section className={styles.semaine} aria-labelledby="au-debut">
          <div className={styles.semaineTete}>
            <h2 id="au-debut" className={styles.semaineTitre}>
              Au début du chemin
            </h2>
            <span className={styles.semaineInfo}>
              {debutVisible.length} réponse{debutVisible.length > 1 ? "s" : ""}
            </span>
          </div>
          {debutDeplie ? (
            <div className={`${styles.feuille} ${filtre === "debut" || r ? "" : m.deplie}`}>
              <article className={styles.note}>
                <span className={styles.date} />
                <div className={styles.noteCorps}>
                  <div className={styles.origineLigne}>
                    <span className={styles.origine}>Ton questionnaire</span>
                    {filtre !== "debut" && !r ? (
                      <button type="button" className={styles.replier} onClick={() => setDebutOuvert(false)}>
                        Replier ▴
                      </button>
                    ) : null}
                  </div>
                  {debutVisible.map((l, i) => (
                    <div key={i} className={styles.ligne}>
                      <span className={styles.question}>{l.question}</span>
                      <p className={styles.reponse}>{l.reponse}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <button type="button" className={styles.replie} aria-expanded={false} onClick={() => setDebutOuvert(true)}>
              <span>Tes réponses au questionnaire. C&apos;est ton point de départ : on y reviendra à la fin.</span>
              <span className={styles.deplier}>Déplier ▾</span>
            </button>
          )}
        </section>
      ) : null}

      <p className={styles.confidentiel}>Ton carnet n&apos;est lu par personne de l&apos;équipe. Il sert à toi, et à adapter ton chemin.</p>
    </main>
  );
}
