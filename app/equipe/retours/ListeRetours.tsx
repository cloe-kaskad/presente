"use client";

import { useMemo, useState, useTransition } from "react";
import { marquerTraite, noterRetour } from "@/app/retours/actions";
import { TYPES_RETOUR, libelleType, pourClaude, type RetourLu } from "@/lib/retours/types";
import styles from "./retours.module.css";

type Retour = RetourLu & { image: string | null };

const quand = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function ListeRetours({ retours }: { retours: Retour[] }) {
  const [page, setPage] = useState("");
  const [qui, setQui] = useState("");
  const [type, setType] = useState("");
  const [statut, setStatut] = useState<"a_traiter" | "traite" | "">("a_traiter");
  const [copie, setCopie] = useState(false);
  const pages = useMemo(() => [...new Set(retours.map((r) => r.page_url))].sort(), [retours]);
  const personnes = useMemo(() => [...new Set(retours.map((r) => r.prenom ?? "Sans prénom"))].sort(), [retours]);
  const visibles = retours.filter(
    (r) =>
      (!page || r.page_url === page) &&
      (!qui || (r.prenom ?? "Sans prénom") === qui) &&
      (!type || r.types.includes(type)) &&
      (!statut || (statut === "traite" ? r.traite : !r.traite)),
  );

  return (
    <>
      <div className={styles.outils}>
        <label>
          Page
          <select value={page} onChange={(e) => setPage(e.target.value)}>
            <option value="">Toutes</option>
            {pages.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Personne
          <select value={qui} onChange={(e) => setQui(e.target.value)}>
            <option value="">Toutes</option>
            {personnes.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous</option>
            {TYPES_RETOUR.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          État
          <select value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}>
            <option value="a_traiter">À traiter</option>
            <option value="traite">Traité</option>
            <option value="">Tous</option>
          </select>
        </label>
        <button
          type="button"
          className="bouton"
          onClick={async () => {
            await navigator.clipboard.writeText(pourClaude(retours, quand)).catch(() => null);
            setCopie(true);
            window.setTimeout(() => setCopie(false), 2500);
          }}
        >
          {copie ? "Copié" : "Copier pour Claude"}
        </button>
      </div>
      <p className={styles.compte} aria-live="polite">
        {visibles.length} retour{visibles.length > 1 ? "s" : ""} · {retours.filter((r) => !r.traite).length} à traiter en tout
      </p>
      {visibles.length ? (
        <ol className={styles.liste}>
          {visibles.map((r) => (
            <Carte key={r.id} r={r} />
          ))}
        </ol>
      ) : (
        <p className={styles.vide}>Rien ici pour l&apos;instant.</p>
      )}
    </>
  );
}

function Carte({ r }: { r: Retour }) {
  const [traite, setTraite] = useState(r.traite);
  const [note, setNote] = useState(r.note ?? "");
  const [enCours, demarrer] = useTransition();
  const [noteVue, setNoteVue] = useState(false);
  return (
    <li className={`${styles.carte} ${traite ? styles.traite : ""}`}>
      <div className={styles.entete}>
        <strong>{r.prenom ?? "Une testeuse"}</strong>
        <span>{quand(r.created_at)}</span>
        <span>
          {[r.appareil === "telephone" ? "téléphone" : r.appareil, r.ecran_largeur ? `${r.ecran_largeur} px` : null, r.semaine ? `semaine ${r.semaine}` : null, r.etape]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <div className={styles.ou}>
        <span className={styles.adresse}>{r.page_url}</span>
        {r.page_titre ? <span>{r.page_titre}</span> : null}
        <span className={styles.element}>{r.toute_la_page ? "Sur toute la page" : r.element_texte ? `Pointé : « ${r.element_texte} »` : "Un endroit de la page"}</span>
      </div>
      {r.types.length ? (
        <div className={styles.types}>
          {r.types.map((t) => (
            <span key={t}>{libelleType(t)}</span>
          ))}
        </div>
      ) : null}
      <p className={styles.texte}>{r.texte}</p>
      {r.image ? (
        <a href={r.image} target="_blank" rel="noopener noreferrer" className={styles.image}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.image} alt="Image jointe par la testeuse" />
        </a>
      ) : null}
      <div className={styles.pied}>
        <label className={styles.case}>
          <input
            type="checkbox"
            checked={traite}
            disabled={enCours}
            onChange={(e) => {
              const v = e.target.checked;
              setTraite(v);
              demarrer(async () => {
                const x = await marquerTraite(r.id, v).catch(() => ({ ok: false }));
                if (!x.ok) setTraite(!v);
              });
            }}
          />
          Traité
        </label>
        <a href={r.page_url} target="_blank" rel="noopener noreferrer">
          Ouvrir la page
        </a>
      </div>
      <label className={styles.note}>
        <span>Note</span>
        <textarea
          rows={2}
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() =>
            demarrer(async () => {
              const x = await noterRetour(r.id, note).catch(() => ({ ok: false }));
              setNoteVue(x.ok);
              if (x.ok) window.setTimeout(() => setNoteVue(false), 1500);
            })
          }
        />
        {noteVue ? <span className={styles.enregistre}>Enregistrée</span> : null}
      </label>
    </li>
  );
}
