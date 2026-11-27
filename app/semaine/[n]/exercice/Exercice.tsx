"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enregistrerEntree } from "@/app/carnet/actions";
import { AvecSesMots } from "@/components/AvecSesMots";
import { CestNote } from "@/components/CestNote";
import { ChampCarnet } from "@/components/ChampCarnet";
import m from "@/components/mouvement.module.css";
import { CitationSiLent } from "@/components/CitationSiLent";
import { CurseurCarnet } from "@/components/SaisieCarnet";
import type { Citation } from "@/lib/rituel/citations";
import { QUESTIONS_ACTE } from "@/lib/semaines/contenu";
import { codeRetiens, type EtatExercice } from "@/lib/semaines/exercice";
import { commencerExercice, terminerExercice } from "../../actions";
import { Guidage } from "./Guidage";
import styles from "./exercice.module.css";

type Pratique = {
  nom: string;
  consigne: string | null;
  regles: string | null;
  pourquoi: string | null;
  rythme: string | null;
  forme: string | null;
  /** Le guidage audio : l'identifiant de la pratique, le fichier, et l'enregistrement provisoire (phase de test). */
  guidage?: { cle: string; fichier: string; provisoire: string | null } | null;
};
type Jour = { jour: string; date: string; reponse: string };

const ETAT: Record<EtatExercice, string> = { pas_commence: "pas commencé", en_cours: "en cours", termine: "terminé" };
const capitale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const point = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

export function Exercice({
  n,
  agir,
  etat,
  pratique,
  intro,
  origine,
  total,
  jourCourant,
  aujourdhui,
  jours,
  autres,
  initiales,
  citation,
}: {
  n: number;
  agir: boolean;
  etat: EtatExercice;
  pratique: Pratique;
  intro: string | null;
  origine: { titre: string; type: string } | null;
  total: number | null;
  jourCourant: number | null;
  aujourdhui: { code: string; date: string; reponse: string };
  jours: Jour[];
  autres: { code: string; question: string; reponse: string }[];
  initiales: Record<string, string>;
  citation: Citation;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [decale, setDecale] = useState(Boolean(initiales[`s${n}:decale`]));

  const agirSur = (action: (n: number) => Promise<{ ok: boolean }>) =>
    demarrer(async () => {
      await action(n);
      router.refresh();
    });

  const jourDuJour = aujourdhui.code.split(":").pop();
  // Le jour qu'elle vient de noter glisse en tête de « Ce que tu as déjà noté » (brief V0.8).
  const [vientDeNoter, setVientDeNoter] = useState(false);
  const notes = jours.length;
  const aujourdhuiNote = Boolean(aujourdhui.reponse);
  const ou = etat === "en_cours" && total && jourCourant ? `en cours, jour ${jourCourant} sur ${total}` : ETAT[etat];
  const nature = agir ? "Ton geste" : "Exercice";
  const surtitre = [nature, pratique.rythme?.toLowerCase(), ou].filter(Boolean).join(" · ");

  const consigne = (
    <>
      {/* Le guidage audio, au-dessus de la consigne ; la consigne écrite reste visible pour celles qui ne peuvent pas écouter */}
      {pratique.guidage ? <Guidage n={n} cle={pratique.guidage.cle} fichier={pratique.guidage.fichier} provisoire={pratique.guidage.provisoire} /> : null}
      <section className={styles.consigne} aria-labelledby="consigne">
        <h2 id="consigne" className={styles.etiquette}>
          La consigne
        </h2>
        {intro ? (
          <p className={styles.intro}>
            <AvecSesMots texte={intro} />
          </p>
        ) : null}
        {pratique.consigne ? <p className={styles.consigneTexte}>{pratique.consigne}</p> : null}
        {pratique.regles ? (
          <details className={styles.depliant}>
            <summary>Les règles</summary>
            <p>{pratique.regles}</p>
          </details>
        ) : null}
        {pratique.pourquoi ? (
          <details className={styles.depliant}>
            <summary>Pourquoi ça compte</summary>
            <p>{pratique.pourquoi}</p>
          </details>
        ) : null}
      </section>
    </>
  );

  // Ce qu'elle a déjà noté : les jours passés (du plus récent au plus ancien), puis ce qu'elle a écrit avant.
  const dejaNote = (titre: string, liste: Jour[]) =>
    liste.length || autres.length ? (
      <section className={styles.note} aria-labelledby="deja">
        <h2 id="deja" className={styles.etiquette}>
          {titre}
        </h2>
        <div>
          {liste.map((j) => (
            <div key={j.jour} className={`${styles.ligneNote} ${vientDeNoter && j.jour === jourDuJour ? m.monte : ""}`}>
              <span className={styles.jourNote}>{capitale(j.date.split(" ")[0])}</span>
              <span className={styles.texteNote}>« {j.reponse} »</span>
            </div>
          ))}
          {autres.map((a) => (
            <div key={a.code} className={styles.ligneNote}>
              <span className={styles.jourNote}>{a.question.length < 26 ? a.question : "Noté"}</span>
              <span className={styles.texteNote}>« {a.reponse} »</span>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <main className={styles.page}>
      {/* « Commencer », « J'ai terminé » : si le serveur tarde, une citation pendant l'attente. */}
      {enCours ? <CitationSiLent delai={400} /> : null}
      <div className={styles.filHaut}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.origine}>
          {origine ? `Après ${origine.type ? `le ${origine.type} ` : ""}« ${origine.titre} » · ` : ""}
          <Link href={`/semaine/${n}`}>revoir le contenu</Link>
        </span>
      </div>

      <div className={styles.tete}>
        <span className={styles.surtitre}>{surtitre}</span>
        <h1 className={styles.titre}>{point(pratique.nom)}</h1>
        {total && (etat !== "termine" || notes > 0) ? (
          <span className={styles.barre} role="img" aria-label={`${notes} jour${notes > 1 ? "s" : ""} noté${notes > 1 ? "s" : ""} sur ${total}`}>
            {Array.from({ length: total }, (_, i) => (
              <i
                key={i}
                className={
                  i < notes ? styles.fait : etat === "en_cours" && !aujourdhuiNote && i === notes ? styles.aujourdhui : styles.avenir
                }
              />
            ))}
          </span>
        ) : null}
      </div>

      {etat === "pas_commence" ? (
        <>
          {consigne}
          <div className={styles.actions}>
            <button type="button" className="bouton" onClick={() => agirSur(commencerExercice)} disabled={enCours}>
              {total ? "Commencer aujourd'hui" : "Commencer"}
            </button>
            <span className={styles.aide}>Tu peux aussi le garder pour plus tard : il t&apos;attend dans « Mon chemin ».</span>
          </div>
        </>
      ) : null}

      {etat === "en_cours" ? (
        <div className={styles.colonnes}>
          <div className={styles.colonne}>
            <section className={styles.saisie} aria-labelledby="saisie">
              {total ? (
                <SaisieDuJour n={n} nom={pratique.nom} aujourdhui={aujourdhui} onNote={() => setVientDeNoter(true)} />
              ) : agir ? (
                <>
                  <h2 id="saisie" className={styles.saisieTitre}>
                    Je l&apos;ai fait.
                  </h2>
                  {QUESTIONS_ACTE.map((q, i) => (
                    <ChampCarnet key={i} semaine={n} type="acte" code={`s${n}:acte:${i + 1}`} question={q.texte} initial={initiales[`s${n}:acte:${i + 1}`] ?? ""} />
                  ))}
                  <div className={styles.decaler}>
                    <span>
                      {decale
                        ? "C'est décalé. Il t'attendra, sans compte à rebours."
                        : "Pas encore fait ? Et si ce n'est pas le moment, tu peux le décaler."}
                    </span>
                    {!decale ? (
                      <button
                        type="button"
                        className={styles.lien}
                        onClick={async () => {
                          setDecale(true);
                          await enregistrerEntree({
                            semaine: n,
                            type: "acte",
                            code: `s${n}:decale`,
                            question: `${pratique.nom} : décalé`,
                            reponse: `Décalé le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
                          }).catch(() => null);
                        }}
                      >
                        Décaler
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <h2 id="saisie" className={styles.saisieTitre}>
                    Ta réponse.
                  </h2>
                  <FormulaireExercice n={n} pratique={pratique} initiales={initiales} />
                </>
              )}
            </section>
            {total ? dejaNote("Ce que tu as déjà noté", jours) : null}
            <div className={styles.actions}>
              <button type="button" className="bouton bouton--grand" onClick={() => agirSur(terminerExercice)} disabled={enCours}>
                {agir ? "Garder dans mon carnet" : "J'ai terminé"}
              </button>
              <span className={styles.aide}>Tout ce que tu écris est rangé dans ton carnet au fur et à mesure.</span>
            </div>
          </div>
          <div className={styles.colonne}>{consigne}</div>
        </div>
      ) : null}

      {etat === "termine" ? (
        <>
          <section className={styles.retiens} aria-labelledby="retiens">
            <h2 id="retiens" className={styles.saisieTitre}>
              Ce que tu en retiens.
            </h2>
            <ChampCarnet
              semaine={n}
              type={agir ? "acte" : "exercice"}
              code={codeRetiens(n)}
              question={`${pratique.nom} · Ce que j'en retiens`}
              libelle="Une ligne suffit."
              initial={initiales[codeRetiens(n)] ?? ""}
              surFond="rose"
            />
            <span className={styles.aide}>Tout est rangé dans ton carnet. Tu peux le relire ici quand tu veux.</span>
            <div className={styles.liens}>
              <Link href="/chemin" className="bouton">
                Retour à mon chemin
              </Link>
              <Link href="/carnet" className={styles.lienFort}>
                Voir dans mon carnet
              </Link>
            </div>
          </section>
          <section className={`${styles.citation} ${m.monte}`} aria-label="Une citation">
            <span className={styles.citationEtiquette}>{agir ? "Geste fait" : "Exercice terminé"}</span>
            <p className={styles.citationTexte}>« {citation.texte} »</p>
            <span className={styles.citationAutrice}>
              <strong>{citation.autrice}</strong>, {citation.source}
            </span>
          </section>
          {dejaNote(total && jours.length > 1 ? `Tes ${jours.length} jours` : "Ce que tu as noté", jours)}
          {consigne}
        </>
      ) : null}
    </main>
  );
}

/** Un exercice sur plusieurs jours : la saisie du jour, avec un bouton pour la ranger. */
function SaisieDuJour({ n, nom, aujourdhui, onNote }: { n: number; nom: string; aujourdhui: { code: string; date: string; reponse: string }; onNote: () => void }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(aujourdhui.reponse);
  const [etat, setEtat] = useState<"rien" | "envoi" | "note" | "erreur">(aujourdhui.reponse ? "note" : "rien");
  const [vient, setVient] = useState(false);
  const jour = aujourdhui.date.split(" ")[0].toLowerCase();

  return (
    <form
      className={styles.jourForm}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valeur.trim()) return;
        setEtat("envoi");
        const r = await enregistrerEntree({ semaine: n, type: "exercice", code: aujourdhui.code, question: `${nom} · ${capitale(aujourdhui.date)}`, reponse: valeur.trim() }).catch(() => ({ ok: false }));
        setEtat(r.ok ? "note" : "erreur");
        if (r.ok) {
          setVient(true);
          onNote();
          router.refresh();
        }
      }}
    >
      <h2 id="saisie" className={styles.saisieTitre}>
        Aujourd&apos;hui, {jour}.
      </h2>
      <label className={styles.champ}>
        <span>Ce que tu notes aujourd&apos;hui.</span>
        <textarea value={valeur} onChange={(e) => {
            setValeur(e.target.value);
            if (etat === "note") setEtat("rien");
          }} rows={3} placeholder="Une ligne suffit." />
      </label>
      <div className={styles.jourActions}>
        {etat === "note" ? (
          <CestNote anime={vient} suite="À demain." />
        ) : (
          <>
            <button type="submit" className="bouton" disabled={etat === "envoi" || !valeur.trim()}>
              {aujourdhui.reponse ? "Modifier ce jour" : "Noter ce jour"}
            </button>
            <span role="status" className={styles.aide}>
              {etat === "erreur" ? "Ça n'a pas été enregistré. Réessaie dans un instant." : ""}
            </span>
          </>
        )}
      </div>
    </form>
  );
}

/** Un exercice en une fois, selon le champ « Forme de réponse » de la pratique. */
function FormulaireExercice({ n, pratique, initiales }: { n: number; pratique: Pratique; initiales: Record<string, string> }) {
  const forme = pratique.forme ?? "Texte libre";
  const q = (label: string) => `${pratique.nom} · ${label}`;
  const val = (code: string) => initiales[code] ?? "";
  if (forme === "Liste ou colonnes") {
    return (
      <>
        {["Premier élément", "Deuxième élément", "Troisième élément"].map((l, i) => (
          <ChampCarnet key={l} semaine={n} type="exercice" code={`s${n}:exo:${i + 1}`} question={q(l)} libelle={l} initial={val(`s${n}:exo:${i + 1}`)} ligne />
        ))}
      </>
    );
  }
  if (forme === "Curseur") {
    return (
      <>
        <CurseurCarnet semaine={n} type="exercice" code={`s${n}:exo:curseur`} question={q("Où tu en es")} label="Où tu en es" gauche="pas du tout" droite="tout à fait" />
        <ChampCarnet semaine={n} type="exercice" code={`s${n}:exo:1`} question={q("Ce que tu en dis")} libelle="Ce que tu en dis" initial={val(`s${n}:exo:1`)} />
      </>
    );
  }
  const note = forme === "Audio" || forme === "Photo" ? " (l'audio et la photo arriveront plus tard : écris-le ici)" : "";
  return <ChampCarnet semaine={n} type="exercice" code={`s${n}:exo:1`} question={q(`Ta réponse${note}`)} libelle={`Ta réponse${note}`} initial={val(`s${n}:exo:1`)} />;
}
