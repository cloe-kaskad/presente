"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { CestNote } from "@/components/CestNote";
import { HUMEURS, couleurDe } from "@/lib/rituel/humeurs";
import { MOT_LONGUEUR_MAX } from "@/lib/rituel/mots";
import { ajouterMonMot, noterHumeur, retirerMonMot } from "./actions";
import styles from "./espace.module.css";

/**
 * « Comment tu vas, aujourd'hui ? » : un mot, une phrase si elle veut, une fois par jour (modifiable).
 * La même carte sur Mon chemin et en haut de Mon journal (brief V0.12). Déjà notée aujourd'hui, elle se replie :
 * « Aujourd'hui, tu as noté calme. », sa phrase, et « Modifier » qui la rouvre avec son choix.
 */
export function Humeur({
  initiale,
  noteInitiale,
  mesMots: motsInitiaux = [],
  surJournal = false,
}: {
  initiale?: string;
  noteInitiale?: string;
  /** Ses mots à elle (« + un mot »), après les dix mots de base. */
  mesMots?: string[];
  surJournal?: boolean;
}) {
  const router = useRouter();
  const Titre = surJournal ? "h2" : "h3";
  // Ce qui est enregistré pour aujourd'hui (la carte repliée le montre).
  const [notee, setNotee] = useState<{ humeur: string; note: string } | null>(initiale ? { humeur: initiale, note: noteInitiale ?? "" } : null);
  const [ouverte, setOuverte] = useState(!initiale);
  const [humeur, setHumeur] = useState(initiale ?? "");
  const [note, setNote] = useState(noteInitiale ?? "");
  const [erreur, setErreur] = useState(false);
  // La coche ne se dessine que quand elle vient d'enregistrer, pas à l'ouverture de la page.
  const [vient, setVient] = useState(false);
  const [enCours, demarrer] = useTransition();
  // « + un mot » : ses mots à elle, et le petit champ d'ajout.
  const [mots, setMots] = useState(motsInitiaux);
  const [ajout, setAjout] = useState(false);
  const [nouveau, setNouveau] = useState("");
  const [messageMot, setMessageMot] = useState<string | null>(null);
  const [ajoutEnCours, demarrerAjout] = useTransition();
  const champMot = useRef<HTMLInputElement>(null);
  const boutonPlus = useRef<HTMLButtonElement>(null);

  const fermerAjout = () => {
    setAjout(false);
    setNouveau("");
    setMessageMot(null);
    requestAnimationFrame(() => boutonPlus.current?.focus());
  };
  const ajouter = () =>
    demarrerAjout(async () => {
      const r = await ajouterMonMot(nouveau).catch(() => ({ ok: false as const, erreur: "Ce n'est pas enregistré. Réessaie dans un instant.", mots }));
      if (!r.ok) {
        setMessageMot(r.erreur);
        return;
      }
      setMots(r.mots);
      setHumeur(r.mot);
      setAjout(false);
      setNouveau("");
      setMessageMot(null);
    });
  const retirer = (mot: string) =>
    demarrerAjout(async () => {
      const r = await retirerMonMot(mot).catch(() => ({ ok: false, mots }));
      setMots(r.mots);
      if (r.ok && humeur === mot) setHumeur("");
      champMot.current?.focus();
    });

  const envoyer = () =>
    demarrer(async () => {
      const r = await noterHumeur(humeur, note).catch(() => ({ ok: false, detresse: false }));
      if (r.detresse) {
        router.push("/quand-ca-ne-va-pas");
        return;
      }
      setErreur(!r.ok);
      if (r.ok) {
        setNotee({ humeur, note: note.trim() });
        setOuverte(false);
        setVient(true);
        // Le calendrier et la liste du journal (et Mon chemin) se mettent à jour sans recharger la page.
        router.refresh();
      }
    });

  return (
    <section id="comment-tu-vas" className={`${styles.bloc} ${styles.humeur}`} aria-labelledby="humeur-titre" tabIndex={-1}>
      <Titre id="humeur-titre" className={styles.blocTitre}>
        Comment tu vas, aujourd&apos;hui ?
      </Titre>
      {!ouverte && notee ? (
        <div className={styles.humeurRepliee}>
          <i
            style={{ background: couleurDe(notee.humeur).fond, ...(couleurDe(notee.humeur).bord ? { border: `1.5px solid ${couleurDe(notee.humeur).bord}` } : {}) }}
            aria-hidden="true"
          />
          <div className={styles.humeurReplieeTexte}>
            <span>
              Aujourd&apos;hui, tu as noté <strong>{notee.humeur}</strong>.
            </span>
            {notee.note ? <span className={styles.humeurPhrase}>« {notee.note} »</span> : null}
            {vient ? <CestNote anime className={styles.note} /> : null}
          </div>
          <button
            type="button"
            className={styles.modifier}
            onClick={() => {
              setHumeur(notee.humeur);
              setNote(notee.note);
              setVient(false);
              setOuverte(true);
            }}
          >
            Modifier
          </button>
        </div>
      ) : (
        <>
          <div className={styles.puces} role="radiogroup" aria-labelledby="humeur-titre">
            {[...HUMEURS, ...mots].map((h, i) => {
              const aElle = i >= HUMEURS.length;
              const puce = (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={humeur === h}
                  className={`${styles.puce} ${humeur === h ? styles.puceChoisie : ""} ${aElle && ajout ? styles.puceAvecCroix : ""}`}
                  onClick={() => setHumeur(h)}
                >
                  {h}
                </button>
              );
              // Pendant l'ajout, ses mots à elle montrent une croix pour les retirer de la liste.
              return aElle && ajout ? (
                <span key={h} className={styles.puceGroupe}>
                  {puce}
                  <button type="button" className={styles.croix} aria-label={`Retirer ${h}`} disabled={ajoutEnCours} onClick={() => retirer(h)}>
                    ×
                  </button>
                </span>
              ) : (
                puce
              );
            })}
            {ajout ? (
              <span className={styles.ajoutMot}>
                <input
                  ref={champMot}
                  value={nouveau}
                  maxLength={MOT_LONGUEUR_MAX}
                  aria-label="Ton mot"
                  aria-describedby="mot-aide"
                  autoFocus
                  onChange={(e) => {
                    setNouveau(e.target.value);
                    setMessageMot(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (nouveau.trim()) ajouter();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      fermerAjout();
                    }
                  }}
                />
                <button type="button" className={styles.ajouter} disabled={!nouveau.trim() || ajoutEnCours} onClick={ajouter}>
                  Ajouter
                </button>
              </span>
            ) : (
              <button ref={boutonPlus} type="button" className={styles.plusUnMot} onClick={() => setAjout(true)}>
                + un mot
              </button>
            )}
          </div>
          {ajout ? (
            <p id="mot-aide" className={styles.motAide} role={messageMot ? "alert" : undefined}>
              {messageMot ?? "Ton mot reste dans la liste, pour la prochaine fois. Une croix permet de le retirer."}
            </p>
          ) : null}
          <label className={styles.ligneLibre}>
            <span>
              Pourquoi, en une phrase ? <span className={styles.facultatif}>(si tu veux)</span>
            </span>
            <input className="champ" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="button" className="bouton" onClick={envoyer} disabled={!humeur || enCours}>
              {enCours ? "J'enregistre…" : "Noter ma journée"}
            </button>
            {surJournal ? null : (
              <Link href="/journal" className={styles.lienDiscret}>
                Voir mon journal
              </Link>
            )}
          </div>
          {erreur ? (
            <p className={styles.erreur} role="alert">
              Ce n&apos;est pas enregistré. Vérifie ta connexion et réessaie.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
