"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Curseur } from "@/components/Curseur";
import { quetesDuZoom } from "@/lib/chemin/calcul";
import {
  CURSEUR_ENVIE,
  FIL_ROUGE,
  FIL_ROUGE_DROITE,
  FIL_ROUGE_GAUCHE,
  FORMATS,
  PARTIE5,
  QUESTION_APPELLE,
  QUESTION_PAS_ENCORE,
  QUESTIONS_OUVERTES,
  QUETE,
  TEMPS,
  ZOOM,
  codesDe,
  phraseZoom,
  type CodeCapacite,
  type QueteId,
} from "@/lib/questionnaire/contenu";
import { TITRES_PARTIES, indexDeReprise, listeEtapes, partieDe } from "@/lib/questionnaire/etapes";
import type { NumeroPartie, Reponses } from "@/lib/questionnaire/reponses";
import { enregistrerEtape, enregistrerPartie, tracerMonChemin } from "./actions";
import styles from "./questionnaire.module.css";

type Statut = "idle" | "en_cours" | "ok" | "erreur";

const DELAI_SAUVEGARDE = 700;

export function Questionnaire({
  initiales,
  etapeEnregistree,
  email,
}: {
  initiales: Reponses;
  etapeEnregistree: string | null;
  email: string;
}) {
  const [reponses, setReponses] = useState<Reponses>(initiales);
  const reponsesRef = useRef(reponses);
  reponsesRef.current = reponses;

  const zoom = useMemo(() => quetesDuZoom(reponses[2].quetes), [reponses]);
  const etapes = useMemo(() => listeEtapes(zoom), [zoom]);
  const [index, setIndex] = useState(() => indexDeReprise(listeEtapes(quetesDuZoom(initiales[2].quetes)), etapeEnregistree));
  const etape = etapes[Math.min(index, etapes.length - 1)];
  const partie = partieDe(etape);

  // --- Sauvegarde automatique -------------------------------------------------
  const [statut, setStatut] = useState<Statut>("idle");
  const minuteurs = useRef<Partial<Record<NumeroPartie, ReturnType<typeof setTimeout>>>>({});
  const enAttente = useRef<Set<NumeroPartie>>(new Set());

  const sauver = useCallback(async (p: NumeroPartie, etapeCourante?: string) => {
    enAttente.current.delete(p);
    setStatut("en_cours");
    try {
      const r = await enregistrerPartie(p, reponsesRef.current[p], etapeCourante);
      setStatut(r.ok ? "ok" : "erreur");
      return r.ok;
    } catch {
      setStatut("erreur");
      return false;
    }
  }, []);

  const programmer = useCallback(
    (p: NumeroPartie) => {
      enAttente.current.add(p);
      clearTimeout(minuteurs.current[p]);
      minuteurs.current[p] = setTimeout(() => void sauver(p), DELAI_SAUVEGARDE);
    },
    [sauver],
  );

  const vider = useCallback(async () => {
    const parties = [...enAttente.current];
    parties.forEach((p) => clearTimeout(minuteurs.current[p]));
    await Promise.all(parties.map((p) => sauver(p)));
  }, [sauver]);

  // Ne rien perdre si elle ferme l'onglet pendant une sauvegarde en attente.
  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => {
      if (enAttente.current.size) {
        void vider();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", avant);
    return () => window.removeEventListener("beforeunload", avant);
  }, [vider]);

  function maj<N extends NumeroPartie>(p: N, f: (ancienne: Reponses[N]) => Reponses[N]) {
    setReponses((r) => {
      const suivante = { ...r, [p]: f(r[p]) };
      reponsesRef.current = suivante;
      return suivante;
    });
    programmer(p);
  }

  // --- Navigation ---------------------------------------------------------------
  const titreRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titreRef.current?.focus();
  }, [index]);

  async function aller(nouvelIndex: number) {
    await vider();
    const i = Math.max(0, Math.min(nouvelIndex, etapes.length - 1));
    setIndex(i);
    window.scrollTo({ top: 0 });
    void enregistrerEtape(etapes[i]);
  }

  // --- Fin -----------------------------------------------------------------------
  const [trace, demarrerTrace] = useTransition();
  const [erreurFin, setErreurFin] = useState<string | null>(null);
  function terminer() {
    setErreurFin(null);
    demarrerTrace(async () => {
      await vider();
      const r = await tracerMonChemin();
      if (r && !r.ok) setErreurFin(r.erreur);
    });
  }

  const progression = Math.round((index / (etapes.length - 1)) * 100);
  const facultatif = isFacultative(etape);

  return (
    <div className={styles.page}>
      <div className={styles.progression} aria-hidden="true">
        <div style={{ width: `${progression}%` }} />
      </div>
      <header className={styles.entete}>
        {index > 0 ? (
          <button type="button" className={styles.retour} onClick={() => aller(index - 1)}>
            ← Retour
          </button>
        ) : (
          <Link href="/" className={styles.retour}>
            ← Accueil
          </Link>
        )}
        <span className={`titre-nom ${styles.marqueOrdi}`}>Présente&nbsp;!</span>
        {partie > 0 ? (
          <span className={styles.partie}>
            <span className={styles.slash}>/</span> Partie {partie} sur 5 · {TITRES_PARTIES[partie]}
          </span>
        ) : (
          <span className={styles.partie}>
            <span className={styles.slash}>/</span> Le questionnaire
          </span>
        )}
      </header>

      <main className={styles.corps}>
        <Ecran
          etape={etape}
          reponses={reponses}
          maj={maj}
          titreRef={titreRef}
          email={email}
        />
      </main>

      <footer className={styles.pied}>
        <span className={styles.statut} role="status" aria-live="polite">
          {partie === 0 || etape === "fin"
            ? ""
            : statut === "en_cours"
              ? "Enregistrement…"
              : statut === "erreur"
                ? "Pas enregistré. Vérifie ta connexion, on réessaie."
                : "Enregistré automatiquement"}
        </span>
        <div className={styles.actions}>
          {etape === "fin" ? (
            <>
              {erreurFin ? (
                <p className={styles.erreur} role="alert">
                  {erreurFin}
                </p>
              ) : null}
              <button type="button" className="bouton bouton--grand" onClick={terminer} disabled={trace}>
                {trace ? "On trace ton chemin…" : "Voir ma carte"}
              </button>
            </>
          ) : (
            <>
              {facultatif ? (
                <button type="button" className={styles.passer} onClick={() => aller(index + 1)}>
                  Passer
                </button>
              ) : null}
              <button type="button" className="bouton" onClick={() => aller(index + 1)}>
                {etape === "intro" ? "Commencer" : "Continuer"}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function isFacultative(etape: string) {
  return (
    etape.startsWith("p1:") ||
    etape === "p2:appelle" ||
    etape === "p4:pasencore" ||
    etape === "p5:sujets" ||
    etape === "p5:inspiration"
  );
}

// ---------------------------------------------------------------------------
// Les écrans
// ---------------------------------------------------------------------------

function Titre({ r, children }: { r: React.RefObject<HTMLHeadingElement | null>; children: React.ReactNode }) {
  return (
    <h1 ref={r} tabIndex={-1} className={styles.titre}>
      {children}
    </h1>
  );
}

/**
 * L'âge se tape chiffre par chiffre : on garde ce qu'elle tape tel quel,
 * et on n'enregistre que quand c'est un âge plausible.
 */
function ChampAge({ valeur, onChange }: { valeur: number | undefined; onChange: (age: number | undefined) => void }) {
  const [texte, setTexte] = useState(valeur ? String(valeur) : "");
  const n = Number.parseInt(texte, 10);
  const invalide = texte !== "" && !(n >= 12 && n <= 120);
  return (
    <label className={styles.champLabel}>
      Ton âge
      <input
        className="champ"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        value={texte}
        aria-invalid={invalide || undefined}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, "").slice(0, 3);
          setTexte(t);
          const age = Number.parseInt(t, 10);
          onChange(age >= 12 && age <= 120 ? age : undefined);
        }}
      />
      {invalide ? <span className={styles.aide}>En chiffres, par exemple 36.</span> : null}
    </label>
  );
}

type Maj = <N extends NumeroPartie>(p: N, f: (ancienne: Reponses[N]) => Reponses[N]) => void;

function Ecran({
  etape,
  reponses,
  maj,
  titreRef,
  email,
}: {
  etape: string;
  reponses: Reponses;
  maj: Maj;
  titreRef: React.RefObject<HTMLHeadingElement | null>;
  email: string;
}) {
  if (etape === "intro") {
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>Avant de tracer ton chemin, on a envie de te connaître.</Titre>
        </div>
        <div className={styles.colonneChamp}>
          <p className={styles.texte}>
            Prends un quart d&apos;heure, un thé, un endroit tranquille. Réponds comme tu es aujourd&apos;hui,
            pas comme tu voudrais être.
          </p>
          <p className={styles.texte}>
            À la fin, tu découvres ta carte : là où tu en es, et par où on te propose de commencer.
          </p>
          <p className={styles.note}>
            Chaque réponse est enregistrée : tu peux t&apos;arrêter et reprendre. Personne ne lit tes
            réponses, et elles servent uniquement à composer ton chemin.{" "}
            <Link href="/confidentialite">Ce qu&apos;on en fait</Link>.
          </p>
        </div>
      </div>
    );
  }

  // Partie 1 : tes mots
  if (etape.startsWith("p1:")) {
    const q = QUESTIONS_OUVERTES.find((x) => `p1:${x.id}` === etape)!;
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{q.question}</Titre>
          <p className={styles.texte}>Il n&apos;y a pas de bonne réponse. Écris comme tu parlerais à une amie.</p>
        </div>
        <div className={styles.colonneChamp}>
          <label htmlFor={q.id} className="sr-only">
            Ta réponse
          </label>
          <textarea
            id={q.id}
            className={`champ ${styles.zoneTexte}`}
            placeholder={q.souffle}
            value={reponses[1][q.id] ?? ""}
            maxLength={5000}
            onChange={(e) => {
              const v = e.target.value;
              maj(1, (a) => ({ ...a, [q.id]: v }));
            }}
          />
        </div>
      </div>
    );
  }

  // Partie 2 : une quête
  if (etape.startsWith("p2:") && etape !== "p2:appelle") {
    const id = etape.slice(3) as QueteId;
    const quete = QUETE[id];
    const pos = reponses[2].quetes[id] ?? {};
    const changer = (cle: "ou" | "envie", v: number) =>
      maj(2, (a) => ({ ...a, quetes: { ...a.quetes, [id]: { ...a.quetes[id], [cle]: v } } }));
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <h2 className={`titre-nom ${styles.nomQuete}`}>{quete.nom}</h2>
          <Titre r={titreRef}>{quete.question}.</Titre>
          <p className={styles.texte}>Situe-toi, sans réfléchir trop longtemps.</p>
        </div>
        <div className={`${styles.colonneChamp} ${styles.curseurs}`}>
          <Curseur
            nom={`${id}-ou`}
            legende="Où j'en suis"
            valeur={pos.ou}
            onChange={(v) => changer("ou", v)}
            gauche={quete.gauche}
            droite={quete.droite}
          />
          <Curseur
            nom={`${id}-envie`}
            legende={CURSEUR_ENVIE.question}
            valeur={pos.envie}
            onChange={(v) => changer("envie", v)}
            gauche={CURSEUR_ENVIE.gauche}
            droite={CURSEUR_ENVIE.droite}
          />
        </div>
      </div>
    );
  }

  if (etape === "p2:appelle") {
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{QUESTION_APPELLE}</Titre>
          <p className={styles.texte}>Une quête, une phrase, une image. Tes mots nous aident à choisir.</p>
        </div>
        <div className={styles.colonneChamp}>
          <label htmlFor="appelle" className="sr-only">
            Ta réponse
          </label>
          <textarea
            id="appelle"
            className={`champ ${styles.zoneTexte}`}
            placeholder="L'argent, parce que…"
            value={reponses[2].appelle ?? ""}
            maxLength={5000}
            onChange={(e) => {
              const v = e.target.value;
              maj(2, (a) => ({ ...a, appelle: v }));
            }}
          />
        </div>
      </div>
    );
  }

  // Partie 3 : le zoom
  if (etape.startsWith("p3:")) {
    const id = etape.slice(3) as QueteId;
    const z = reponses[3].zoom[id] ?? { choisies: [], intensite: {} };
    const choisies = (z.choisies ?? []) as CodeCapacite[];
    const plein = choisies.length >= 2;
    const basculer = (code: CodeCapacite) =>
      maj(3, (a) => {
        const actuelle = a.zoom[id] ?? { choisies: [], intensite: {} };
        const deja = actuelle.choisies.includes(code);
        if (!deja && actuelle.choisies.length >= 2) return a;
        const nouvelles = deja ? actuelle.choisies.filter((c) => c !== code) : [...actuelle.choisies, code];
        const intensite = { ...actuelle.intensite };
        if (deja) delete intensite[code];
        return { ...a, zoom: { ...a.zoom, [id]: { ...actuelle, choisies: nouvelles, intensite } } };
      });
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <span className={styles.pastille}>{QUETE[id].nom}</span>
          <Titre r={titreRef}>Qu&apos;est-ce qui te ressemble le plus aujourd&apos;hui ?</Titre>
          <p className={styles.texte}>Deux au plus.</p>
        </div>
        <div className={styles.colonneChamp}>
          <fieldset className={styles.choix}>
            <legend className="sr-only">Phrases sur {QUETE[id].nom.toLowerCase()}</legend>
            {codesDe(id).map((code) => {
              const coche = choisies.includes(code);
              const bloque = plein && !coche;
              return (
                <div key={code} className={`${styles.option} ${coche ? styles.optionCochee : ""}`}>
                  <label className={styles.optionLabel}>
                    <input
                      type="checkbox"
                      checked={coche}
                      aria-disabled={bloque || undefined}
                      onChange={() => {
                        if (!bloque) basculer(code);
                      }}
                    />
                    <span className={styles.case} aria-hidden="true">
                      {coche ? "✓" : ""}
                    </span>
                    <span>{phraseZoom(code)}</span>
                  </label>
                  {coche ? (
                    <div className={styles.intensite}>
                      <Curseur
                        nom={`${code}-intensite`}
                        legende={ZOOM.intensite}
                        valeur={z.intensite?.[code]}
                        onChange={(v) =>
                          maj(3, (a) => {
                            const actuelle = a.zoom[id] ?? { choisies: [], intensite: {} };
                            return {
                              ...a,
                              zoom: { ...a.zoom, [id]: { ...actuelle, intensite: { ...actuelle.intensite, [code]: v } } },
                            };
                          })
                        }
                        gauche={ZOOM.intensiteGauche}
                        droite={ZOOM.intensiteDroite}
                        surFond="rose"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
          {plein ? (
            <p className={styles.note} role="status">
              Tu en as choisi deux. Pour en changer, décoche-en une.
            </p>
          ) : null}
          <label className={styles.champLabel}>
            <span>
              {ZOOM.autrement} <span className={styles.facultatif}>(facultatif)</span>
            </span>
            <input
              className="champ"
              value={z.autrement ?? ""}
              maxLength={5000}
              onChange={(e) => {
                const v = e.target.value;
                maj(3, (a) => {
                  const actuelle = a.zoom[id] ?? { choisies: [], intensite: {} };
                  return { ...a, zoom: { ...a.zoom, [id]: { ...actuelle, autrement: v } } };
                });
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  // Partie 4 : le fil rouge
  if (etape === "p4:filrouge") {
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>Et aujourd&apos;hui, ces phrases-là ?</Titre>
          <p className={styles.texte}>De « pas du tout » à « tout à fait ». C&apos;est ce qu&apos;on regardera bouger à la fin.</p>
        </div>
        <div className={`${styles.colonneChamp} ${styles.curseurs}`}>
          {FIL_ROUGE.map((f) => (
            <Curseur
              key={f.code}
              nom={f.code}
              legende={f.phrase}
              valeur={reponses[4].filRouge[f.code]}
              onChange={(v) => maj(4, (a) => ({ ...a, filRouge: { ...a.filRouge, [f.code]: v } }))}
              gauche={FIL_ROUGE_GAUCHE}
              droite={FIL_ROUGE_DROITE}
            />
          ))}
        </div>
      </div>
    );
  }

  if (etape === "p4:pasencore") {
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{QUESTION_PAS_ENCORE}</Titre>
          <p className={styles.texte}>Facultatif. Une ligne suffit.</p>
        </div>
        <div className={styles.colonneChamp}>
          <label htmlFor="pasencore" className="sr-only">
            Ta réponse
          </label>
          <textarea
            id="pasencore"
            className={`champ ${styles.zoneTexte}`}
            value={reponses[4].pasEncore ?? ""}
            maxLength={5000}
            onChange={(e) => {
              const v = e.target.value;
              maj(4, (a) => ({ ...a, pasEncore: v }));
            }}
          />
        </div>
      </div>
    );
  }

  // Partie 5 : pour régler ton chemin
  if (etape === "p5:temps") {
    const temps = reponses[5].temps;
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{PARTIE5.temps}</Titre>
        </div>
        <div className={styles.colonneChamp}>
          <fieldset className={styles.choix}>
            <legend className="sr-only">{PARTIE5.temps}</legend>
            {TEMPS.map((t) => (
              <div key={t.id} className={`${styles.option} ${temps === t.id ? styles.optionCochee : ""}`}>
                <label className={styles.optionLabel}>
                  <input
                    type="radio"
                    name="temps"
                    checked={temps === t.id}
                    onChange={() => maj(5, (a) => ({ ...a, temps: t.id }))}
                  />
                  <span className={`${styles.case} ${styles.caseRonde}`} aria-hidden="true" />
                  <span>{t.label}</span>
                </label>
              </div>
            ))}
          </fieldset>
          {temps === "30min" ? <p className={styles.note}>{PARTIE5.tempsCourt}</p> : null}
        </div>
      </div>
    );
  }

  if (etape === "p5:formats") {
    const formats = reponses[5].formats ?? [];
    const plein = formats.length >= 2;
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{PARTIE5.formats}</Titre>
          <p className={styles.texte}>{PARTIE5.formatsAide}</p>
        </div>
        <div className={styles.colonneChamp}>
          <fieldset className={styles.choix}>
            <legend className="sr-only">{PARTIE5.formats}</legend>
            {FORMATS.map((f) => {
              const coche = formats.includes(f.id);
              const bloque = plein && !coche;
              return (
                <div key={f.id} className={`${styles.option} ${coche ? styles.optionCochee : ""}`}>
                  <label className={styles.optionLabel}>
                    <input
                      type="checkbox"
                      checked={coche}
                      aria-disabled={bloque || undefined}
                      onChange={() => {
                        if (bloque) return;
                        maj(5, (a) => {
                          const actuels = a.formats ?? [];
                          return {
                            ...a,
                            formats: actuels.includes(f.id) ? actuels.filter((x) => x !== f.id) : [...actuels, f.id],
                          };
                        });
                      }}
                    />
                    <span className={styles.case} aria-hidden="true">
                      {coche ? "✓" : ""}
                    </span>
                    <span>{f.label}</span>
                  </label>
                </div>
              );
            })}
          </fieldset>
        </div>
      </div>
    );
  }

  if (etape === "p5:sujets" || etape === "p5:inspiration") {
    const cle = etape === "p5:sujets" ? "sujets" : "inspiration";
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{cle === "sujets" ? PARTIE5.sujets : PARTIE5.inspiration}</Titre>
          <p className={styles.texte}>
            {cle === "sujets"
              ? "Facultatif. On ne t'enverra jamais rien qui les touche."
              : "Facultatif. Une voix que tu aimes déjà nous aide à en choisir d'autres."}
          </p>
        </div>
        <div className={styles.colonneChamp}>
          <label htmlFor={cle} className="sr-only">
            Ta réponse
          </label>
          <textarea
            id={cle}
            className={`champ ${styles.zoneTexte} ${styles.zoneCourte}`}
            placeholder={cle === "sujets" ? PARTIE5.sujetsSouffle : ""}
            value={reponses[5][cle] ?? ""}
            maxLength={5000}
            onChange={(e) => {
              const v = e.target.value;
              maj(5, (a) => ({ ...a, [cle]: v }));
            }}
          />
        </div>
      </div>
    );
  }

  if (etape === "p5:toi") {
    const p = reponses[5];
    return (
      <div className={styles.ecran}>
        <div className={styles.colonneTexte}>
          <Titre r={titreRef}>{PARTIE5.toi}</Titre>
          <p className={styles.texte}>{PARTIE5.toiAide}</p>
        </div>
        <div className={`${styles.colonneChamp} ${styles.champs}`}>
          <label className={styles.champLabel}>
            Ton prénom
            <input
              className="champ"
              autoComplete="given-name"
              maxLength={60}
              value={p.prenom ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                maj(5, (a) => ({ ...a, prenom: v }));
              }}
            />
          </label>
          <label className={styles.champLabel}>
            Ton email
            <input className="champ" value={email} readOnly aria-readonly="true" />
          </label>
          <div className={styles.deuxChamps}>
            <ChampAge valeur={p.age} onChange={(age) => maj(5, (a) => ({ ...a, age }))} />
            <label className={styles.champLabel}>
              Ton code postal
              <input
                className="champ"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={10}
                value={p.codePostal ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9A-Za-z -]/g, "");
                  maj(5, (a) => ({ ...a, codePostal: v }));
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Fin
  return (
    <div className={styles.ecran}>
      <div className={styles.colonneTexte}>
        <Titre r={titreRef}>C&apos;est tout. Merci.</Titre>
      </div>
      <div className={styles.colonneChamp}>
        <p className={styles.texte}>Ta carte est prête à être tracée : là où tu en es, et par où on te propose de commencer.</p>
        <p className={styles.note}>
          Tes réponses servent uniquement à composer ton chemin. Présente! n&apos;est pas un suivi psychologique.{" "}
          <Link href="/confidentialite">Politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
