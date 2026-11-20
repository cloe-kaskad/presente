"use client";

import { useState } from "react";
import { enregistrerEntree, type EntreeAEnregistrer } from "@/app/carnet/actions";
import { Curseur } from "./Curseur";
import styles from "./ChampCarnet.module.css";

type Base = { semaine: number; type: EntreeAEnregistrer["type"]; code: string; question: string };

async function sauver(e: EntreeAEnregistrer) {
  return enregistrerEntree(e).catch(() => ({ ok: false }));
}

/** Un choix parmi quelques réponses (une année, une idée, « choisie / héritée / subie »), gardé dans le carnet. */
export function ChoixCarnet({ options, initial, label, ...base }: Base & { options: string[]; initial?: string; label: string }) {
  const [choix, setChoix] = useState(initial ?? "");
  const [ok, setOk] = useState<boolean | null>(null);
  const id = `choix-${base.code}`;
  return (
    <div className={styles.champ}>
      <span id={id} className={styles.question}>
        {label}
      </span>
      <div className={styles.puces} role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={choix === o}
            className={`${styles.puce} ${choix === o ? styles.puceChoisie : ""}`}
            onClick={async () => {
              setChoix(o);
              setOk((await sauver({ ...base, reponse: o })).ok);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      <span className={styles.statut} role="status">
        {ok === false ? "Pas enregistré, vérifie ta connexion." : ok ? "Enregistré" : ""}
      </span>
    </div>
  );
}

/** Un curseur de 1 à 5, gardé dans le carnet sous la forme « 4 sur 5 ». */
export function CurseurCarnet({
  label,
  gauche,
  droite,
  initial,
  ...base
}: Base & { label: string; gauche: string; droite: string; initial?: number }) {
  const [v, setV] = useState<number | undefined>(initial);
  return (
    <Curseur
      nom={`curseur-${base.code}`}
      legende={label}
      valeur={v}
      gauche={gauche}
      droite={droite}
      onChange={(n) => {
        setV(n);
        void sauver({ ...base, reponse: `${n} sur 5 (de « ${gauche} » à « ${droite} »)` });
      }}
    />
  );
}
