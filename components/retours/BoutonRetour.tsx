"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { envoyerRetour, preparerImage } from "@/app/retours/actions";
import { IMAGE_MAX, TYPES_RETOUR, UN_DE_SES_TEXTES, texteCourt, type Repere } from "@/lib/retours/types";
import styles from "./retours.module.css";

type Etat = "ferme" | "pointer" | "ecrire" | "envoi" | "merci";
type Point = { x: number; y: number; xPct: number; yPct: number; element: string | null } | null;

/** Ses propres textes (réponses, notes, humeur, champs qu'elle remplit) : on n'en garde jamais le contenu. */
const SES_TEXTES = "input, textarea, select, [contenteditable], [data-sien]";
const NOTRE = "[data-retour]";

/**
 * « Un retour ? » (brief V0.13, point 4) : pour l'équipe et les testeuses seulement. Elle pointe un endroit de la page,
 * écrit ce qu'elle veut dire, joint une image si elle veut. Aucune capture automatique.
 */
export function BoutonRetour() {
  const [etat, setEtat] = useState<Etat>("ferme");
  const [point, setPoint] = useState<Point>(null);
  const [texte, setTexte] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [decalage, setDecalage] = useState(0);
  const bouton = useRef<HTMLButtonElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const bandeau = useRef<HTMLDivElement>(null);

  const fermer = useCallback(() => {
    setEtat("ferme");
    setPoint(null);
    setTexte("");
    setTypes([]);
    setImage(null);
    setErreur(null);
    requestAnimationFrame(() => bouton.current?.focus());
  }, []);

  // Échap quitte le mode retour (le texte en cours n'est pas gardé : c'est un « Annuler »).
  useEffect(() => {
    if (etat === "ferme" || etat === "merci") return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" && etat !== "envoi") {
        e.preventDefault();
        fermer();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [etat, fermer]);

  // Ne jamais recouvrir une barre fixée en bas de l'écran (questionnaire, carte) : le bouton remonte au-dessus.
  useEffect(() => {
    let attente = 0;
    const mesurer = () => {
      attente = 0;
      const sous = document.elementsFromPoint(window.innerWidth - 36, window.innerHeight - 36).filter((e) => !e.closest(NOTRE));
      let haut = 0;
      for (const el of sous) {
        for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
          const pos = getComputedStyle(n).position;
          if (pos === "fixed" || pos === "sticky") {
            const r = n.getBoundingClientRect();
            if (r.bottom >= window.innerHeight - 4) haut = Math.max(haut, window.innerHeight - r.top);
          }
        }
      }
      setDecalage(haut);
    };
    const plus_tard = () => {
      if (!attente) attente = window.setTimeout(mesurer, 150);
    };
    mesurer();
    window.addEventListener("scroll", plus_tard, { passive: true });
    window.addEventListener("resize", plus_tard);
    const t = window.setInterval(mesurer, 1500);
    return () => {
      window.removeEventListener("scroll", plus_tard);
      window.removeEventListener("resize", plus_tard);
      window.clearInterval(t);
      if (attente) window.clearTimeout(attente);
    };
  }, []);

  // Une marge en bas de page, pour que le bouton ne cache jamais le dernier bouton de la page.
  useEffect(() => {
    document.body.classList.add(styles.avecRetour);
    return () => document.body.classList.remove(styles.avecRetour);
  }, []);

  useEffect(() => {
    if (etat === "pointer") bandeau.current?.focus();
    if (etat === "ecrire") champ.current?.focus();
  }, [etat]);

  const pointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const sous = document.elementsFromPoint(e.clientX, e.clientY).find((el) => !el.closest(NOTRE));
    const sien = sous?.closest(SES_TEXTES);
    const doc = document.documentElement;
    const xPct = Math.min(100, Math.max(0, ((e.clientX + window.scrollX) / Math.max(1, doc.scrollWidth)) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY + window.scrollY) / Math.max(1, doc.scrollHeight)) * 100));
    setPoint({ x: e.clientX, y: e.clientY, xPct, yPct, element: sien ? UN_DE_SES_TEXTES : texteCourt((sous as HTMLElement | undefined)?.innerText ?? sous?.textContent) });
    setEtat("ecrire");
  };

  const envoyer = async () => {
    if (!texte.trim()) return;
    setEtat("envoi");
    setErreur(null);
    try {
      let chemin = "";
      if (image) {
        const p = await preparerImage(image.type, image.size);
        if (!p.ok) throw new Error(p.erreur);
        const r = await fetch(p.url, { method: "PUT", headers: { "content-type": image.type }, body: image });
        if (!r.ok) throw new Error("L'image n'a pas pu être envoyée. Réessaie, ou envoie sans image.");
        chemin = p.chemin;
      }
      const repere: Repere = {
        pageUrl: window.location.pathname,
        pageTitre: document.title,
        xPct: point?.xPct ?? null,
        yPct: point?.yPct ?? null,
        elementTexte: point?.element ?? null,
        touteLaPage: !point,
        ecranLargeur: window.innerWidth,
        ecranHauteur: window.innerHeight,
      };
      const f = new FormData();
      f.set("texte", texte);
      f.set("types", JSON.stringify(types));
      f.set("repere", JSON.stringify(repere));
      if (chemin) f.set("image", chemin);
      const r = await envoyerRetour(f);
      if (!r.ok) throw new Error(r.erreur ?? "Ce n'est pas enregistré.");
      setEtat("merci");
      window.setTimeout(fermer, 2000);
    } catch (e) {
      // Sans réseau ou en cas d'erreur : son texte reste là, elle peut réessayer.
      setErreur(e instanceof Error && e.message && !/fetch|network|Failed/i.test(e.message) ? e.message : "Pas de réseau ? Ton texte est gardé.");
      setEtat("ecrire");
    }
  };

  // La fenêtre se pose à côté de la pastille, sans sortir de l'écran ; sur téléphone, en bas de l'écran.
  const largeur = typeof window === "undefined" ? 1024 : window.innerWidth;
  const fenetre: React.CSSProperties =
    point && largeur >= 768
      ? { left: Math.min(point.x + 16, largeur - 376), top: Math.min(Math.max(16, point.y - 40), window.innerHeight - 440) }
      : {};

  return (
    <div data-retour="">
      {etat === "ferme" ? (
        <button ref={bouton} type="button" className={styles.bouton} style={{ bottom: `calc(${16 + decalage}px + env(safe-area-inset-bottom))` }} onClick={() => setEtat("pointer")}>
          Un retour ?
        </button>
      ) : null}

      {etat === "pointer" ? (
        <>
          <div className={styles.voile} onClick={pointer} aria-hidden="true" />
          <div ref={bandeau} className={styles.bandeau} role="dialog" aria-label="Mode retour" tabIndex={-1}>
            <span>Touche l&apos;endroit que tu veux commenter.</span>
            <span className={styles.bandeauLiens}>
              <button type="button" onClick={() => setEtat("ecrire")}>
                Sur toute la page
              </button>
              <button type="button" onClick={fermer}>
                Annuler
              </button>
            </span>
          </div>
        </>
      ) : null}

      {etat === "ecrire" || etat === "envoi" || etat === "merci" ? (
        <>
          {point ? <span className={styles.pastille} style={{ left: point.x, top: point.y }} aria-hidden="true" /> : null}
          <div className={styles.fenetre} style={fenetre} role="dialog" aria-modal="true" aria-labelledby="retour-titre">
            {etat === "merci" ? (
              <p className={styles.merci} role="status">
                Merci, c&apos;est noté.
              </p>
            ) : (
              <>
                <label className={styles.champ}>
                  <span id="retour-titre">Qu&apos;est-ce que tu veux nous dire ?</span>
                  <textarea ref={champ} value={texte} rows={4} maxLength={4000} onChange={(e) => setTexte(e.target.value)} />
                </label>
                <span className={styles.sousTitre}>{point ? (point.element === UN_DE_SES_TEXTES ? "Sur un de tes textes (on ne le lit pas)." : "Sur l'endroit touché.") : "Sur toute la page."}</span>
                <div className={styles.types} role="group" aria-label="Type de retour (facultatif)">
                  {TYPES_RETOUR.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={types.includes(t.id)}
                      className={`${styles.type} ${types.includes(t.id) ? styles.typeChoisi : ""}`}
                      onClick={() => setTypes((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className={styles.image}>
                  <span>{image ? `Image : ${image.name}` : "Ajouter une image"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/heic"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (f && f.size > IMAGE_MAX) {
                        setErreur("L'image dépasse 5 Mo.");
                        return;
                      }
                      setErreur(null);
                      setImage(f);
                    }}
                  />
                </label>
                {erreur ? (
                  <p className={styles.erreur} role="alert">
                    {erreur}
                  </p>
                ) : null}
                <div className={styles.actions}>
                  <button type="button" className="bouton" disabled={!texte.trim() || etat === "envoi"} onClick={envoyer}>
                    {etat === "envoi" ? "J'envoie…" : erreur ? "Réessayer" : "Envoyer"}
                  </button>
                  <button type="button" className={styles.annuler} onClick={fermer} disabled={etat === "envoi"}>
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
