"use client";

import { useEffect, useRef, useState } from "react";
import { enregistrerEntree, type EntreeAEnregistrer } from "@/app/carnet/actions";
import styles from "./ChampCarnet.module.css";

type Statut = "idle" | "en_cours" | "ok" | "erreur";

/**
 * Une question du carnet, enregistrée automatiquement pendant qu'elle écrit.
 * La question affichée est celle qui est enregistrée avec la réponse.
 */
export function ChampCarnet({
  semaine,
  type,
  code,
  question,
  initial = "",
  ligne = false,
  placeholder,
  onChange,
  surFond = "blanc",
  libelle,
}: {
  semaine: number;
  type: EntreeAEnregistrer["type"];
  code: string;
  question: string;
  initial?: string;
  /** Une ligne (un mot, un prénom) plutôt qu'un paragraphe. */
  ligne?: boolean;
  placeholder?: string;
  onChange?: (valeur: string) => void;
  surFond?: "blanc" | "rose" | "sombre";
  /** Ce qui s'affiche au-dessus du champ, si différent de la question enregistrée. */
  libelle?: string;
}) {
  const [valeur, setValeur] = useState(initial);
  const [statut, setStatut] = useState<Statut>("idle");
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const derniere = useRef(initial);

  const sauver = async (v: string) => {
    if (v === derniere.current) return;
    setStatut("en_cours");
    const r = await enregistrerEntree({ semaine, type, code, question, reponse: v }).catch(() => ({ ok: false }));
    if (r.ok) derniere.current = v;
    setStatut(r.ok ? "ok" : "erreur");
  };

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  const changer = (v: string) => {
    setValeur(v);
    onChange?.(v);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void sauver(v), 700);
  };

  const id = `champ-${code}`;
  return (
    <div className={`${styles.champ} ${styles[surFond]}`}>
      <label htmlFor={id} className={styles.question}>
        {libelle ?? question}
      </label>
      {ligne ? (
        <input
          id={id}
          className="champ"
          value={valeur}
          maxLength={500}
          placeholder={placeholder}
          onChange={(e) => changer(e.target.value)}
          onBlur={() => void sauver(valeur)}
        />
      ) : (
        <textarea
          id={id}
          className={`champ ${styles.zone}`}
          value={valeur}
          maxLength={5000}
          placeholder={placeholder ?? "Prends ton temps."}
          onChange={(e) => changer(e.target.value)}
          onBlur={() => void sauver(valeur)}
        />
      )}
      <span className={styles.statut} role="status" aria-live="polite">
        {statut === "en_cours" ? "Enregistrement…" : statut === "ok" ? "Enregistré" : statut === "erreur" ? "Pas enregistré, vérifie ta connexion." : ""}
      </span>
    </div>
  );
}
