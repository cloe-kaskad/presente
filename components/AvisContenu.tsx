"use client";

import { useState } from "react";
import { enregistrerEntree } from "@/app/carnet/actions";
import type { Citation } from "@/lib/rituel/citations";
import { RETOURS } from "@/lib/semaines/etiquettes";
import styles from "./AvisContenu.module.css";

type RetourId = (typeof RETOURS)[number]["id"];

/**
 * « Ce contenu, pour toi ? » (maquettes Contenu-avant et Contenu-apres) : quatre choix, un seul possible,
 * et un mot libre facultatif qui aide à choisir la suite. Le mot est rangé dans son carnet, nulle part ailleurs.
 */
export function AvisContenu({
  semaine,
  code,
  initial,
  motInitial = "",
  question = "Ce contenu, pour toi ?",
  avecMot = true,
  citation,
}: {
  semaine: number;
  code: string;
  initial?: string | null;
  motInitial?: string;
  question?: string;
  avecMot?: boolean;
  /** La citation « Contenu terminé », affichée après l'envoi de l'avis. */
  citation?: Citation;
}) {
  const [retour, setRetour] = useState<RetourId | "">((initial as RetourId) ?? "");
  const [mot, setMot] = useState(motInitial);
  const [motOuvert, setMotOuvert] = useState(Boolean(motInitial));
  const [etat, setEtat] = useState<"rien" | "envoi" | "note" | "erreur">("rien");

  const envoyer = async (r: RetourId | "", m: string) => {
    if (!r) return;
    setEtat("envoi");
    const res = await enregistrerEntree({ semaine, type: "carnet", code, question: m.trim() ? "Pourquoi, en un mot" : "Ce contenu, pour toi", reponse: m.trim(), retour: r }).catch(() => ({ ok: false }));
    setEtat(res.ok ? "note" : "erreur");
  };

  return (
    <>
      <section className={styles.avis} aria-labelledby={`avis-${code}`}>
        <h2 id={`avis-${code}`} className={styles.titre}>
          {question}
        </h2>
        <div className={styles.choix} role="radiogroup" aria-labelledby={`avis-${code}`}>
          {RETOURS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={retour === x.id}
              className={styles.puce}
              onClick={() => {
                setRetour(x.id);
                // Sans mot ouvert, l'avis part tout de suite. Avec un mot, il part avec « Envoyer mon avis ».
                if (!motOuvert) void envoyer(x.id, mot);
                else setEtat("rien");
              }}
            >
              {x.label}
            </button>
          ))}
        </div>

        {avecMot ? (
          motOuvert ? (
            <>
              <label className={styles.champ}>
                <span>
                  Dis-moi pourquoi, ça m&apos;aide à mieux choisir la suite<span className={styles.facultatif}> (facultatif)</span>
                </span>
                <textarea
                  value={mot}
                  maxLength={1000}
                  aria-describedby={`aide-${code}`}
                  onChange={(e) => {
                    setMot(e.target.value);
                    setEtat("rien");
                  }}
                />
              </label>
              <span id={`aide-${code}`} className={styles.aide}>
                Par exemple : je n&apos;accroche pas avec cette autrice, trop court, trop théorique.
              </span>
              <div>
                <button type="button" className={styles.envoyer} disabled={!retour || etat === "envoi"} onClick={() => envoyer(retour, mot)}>
                  Envoyer mon avis
                </button>
              </div>
            </>
          ) : (
            <button type="button" className={styles.ajouter} onClick={() => setMotOuvert(true)}>
              + Ajouter un mot
            </button>
          )
        ) : null}

        <span role="status" className={styles.statut}>
          {etat === "note" ? (
            <>
              <strong>C&apos;est noté.</strong> On en tient compte pour choisir tes prochains contenus.
            </>
          ) : etat === "erreur" ? (
            "Ton avis n'a pas été enregistré. Réessaie dans un instant."
          ) : null}
        </span>
      </section>

      {citation && etat === "note" ? (
        <section className={styles.citation} aria-label="Une citation">
          <span className={styles.citationEtiquette}>Contenu terminé</span>
          <p className={styles.citationTexte}>« {citation.texte} »</p>
          <span className={styles.citationAutrice}>
            <strong>{citation.autrice}</strong>, {citation.source}
          </span>
        </section>
      ) : null}
    </>
  );
}
