"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CestNote } from "@/components/CestNote";
import m from "@/components/mouvement.module.css";
import { de, type EtatBuddy } from "@/lib/buddy/etat";
import { CE_QUE_CA_CHANGE, POINTS_BUDDY } from "@/lib/buddy/explication";
import { TEXTES_A_DEUX as T } from "@/lib/buddy/textes";
import {
  arreterEchange,
  chercherMaBuddy,
  continuerLeMois,
  demanderNouvelleBuddy,
  garderLeLien,
  laisserUnMot,
  rencontrer,
  repondreProposition,
  repondreQuestion,
} from "./actions";
import styles from "./buddy.module.css";

type Moi = { prenom: string | null; quete: string; presentation: string; montrePrenom: boolean; montreQuete: boolean };
type Autre = { prenom: string; quete: string; presentation: string; mention: string; jours: number };
type Question = {
  numero: number;
  mois: number;
  texte: string;
  phrase: boolean;
  phrasesAutre: string[];
  maReponse: string;
  saReponse: string | null;
  monMot: string;
  sonMot: string | null;
};
type Fin = "question" | "oui" | "non" | null;

/** « Un bout de chemin à deux » : se présenter, rencontrer, une question par semaine, sortir à tout moment. */
export function Buddy({
  etat,
  moi,
  autre,
  questions,
  prochaine,
  point,
  fin,
  contactEquipe,
}: {
  etat: EtatBuddy;
  moi: Moi;
  autre: Autre;
  questions: Question[];
  prochaine: string | null;
  point: 1 | 2 | null;
  fin: Fin;
  contactEquipe: string | null;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.tete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.surtitre}>{T.titre}</span>
      </div>
      {etat === "proposee" ? <Debut moi={moi} /> : null}
      {etat === "recherche" ? <Recherche quete={moi.quete} /> : null}
      {etat === "trouvee" ? <Trouvee /> : null}
      {etat === "acceptee" ? <Rencontre autre={autre} questions={questions} prochaine={prochaine} point={point} fin={fin} contactEquipe={contactEquipe} /> : null}
      {etat === "arretee" ? (
        <section className={styles.bloc}>
          <h1 className={styles.titre}>L&apos;échange s&apos;est arrêté.</h1>
          <p className={styles.texte}>Tes réponses restent dans ton carnet.</p>
          <div className={styles.actions}>
            <form action={demanderNouvelleBuddy}>
              <button type="submit" className="bouton">
                {T.nouvelle}
              </button>
            </form>
            <Link href="/chemin" className={styles.lien}>
              Retour à mon chemin
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}

/** Écrans 2 et 3 : « Comment ça se passe », puis sa phrase avec l'aperçu de ce que l'autre verra. */
function Debut({ moi }: { moi: Moi }) {
  const router = useRouter();
  const [ecran, setEcran] = useState<"explication" | "phrase">("explication");
  const [phrase, setPhrase] = useState(moi.presentation);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState(false);

  if (ecran === "explication") {
    return (
      <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="explication">
        <h1 id="explication" className={styles.titre}>
          {T.titre}
        </h1>
        <ul className={styles.points}>
          {POINTS_BUDDY.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className={styles.change}>{CE_QUE_CA_CHANGE}</p>
        <div className={styles.actions}>
          <button type="button" className="bouton" onClick={() => setEcran("phrase")}>
            Ça me tente
          </button>
          <form action={repondreProposition.bind(null, false)}>
            <button type="submit" className={styles.lien}>
              Pas maintenant
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="phrase">
      <h1 id="phrase" className={styles.titre}>
        Ce qui t&apos;amène ici, en une phrase.
      </h1>
      <label className={styles.champ}>
        <span className="sr-only">Ce qui t&apos;amène ici, en une phrase</span>
        <textarea value={phrase} maxLength={300} rows={3} onChange={(e) => setPhrase(e.target.value)} placeholder="Une phrase suffit." />
      </label>
      <div className={styles.apercu} aria-label="Ce qu'elle verra">
        <span className={styles.etiquette}>Ce qu&apos;elle verra</span>
        <span className={styles.apercuNom}>
          {moi.prenom ?? "Toi"}, en chemin sur {moi.quete}
        </span>
        <span className={styles.apercuPhrase}>{phrase.trim() ? `« ${phrase.trim()} »` : "Ta phrase s'affichera ici."}</span>
      </div>
      <p className={styles.petit}>C&apos;est tout ce qu&apos;elle verra de toi, avec tes réponses aux questions de la semaine.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className="bouton"
          disabled={enCours || !phrase.trim()}
          onClick={() =>
            demarrer(async () => {
              const r = await chercherMaBuddy(phrase).catch(() => ({ ok: false }));
              if (r.ok) router.refresh();
              else setErreur(true);
            })
          }
        >
          {T.chercher}
        </button>
        <button type="button" className={styles.lien} onClick={() => setEcran("explication")}>
          Revenir à l&apos;explication
        </button>
      </div>
      {erreur ? <p role="alert">Ce n&apos;est pas enregistré. Réessaie dans un instant.</p> : null}
    </section>
  );
}

/** Écran 4 : on ne montre personne tout de suite. */
function Recherche({ quete }: { quete: string }) {
  return (
    <section className={`${styles.bloc} ${m.monte}`} aria-labelledby="recherche">
      <span className={styles.deuxPoints} aria-hidden="true">
        <i />
        <i />
      </span>
      <h1 id="recherche" className={styles.titre}>
        {T.onCherche}
      </h1>
      <p className={styles.texte}>
        Une femme en chemin depuis à peu près aussi longtemps que toi, si possible sur {quete}. On te prévient ici dès qu&apos;on l&apos;a trouvée.
      </p>
      <p className={styles.petit}>Phase de test : la recherche est simulée.</p>
      <Link href="/chemin" className={styles.lien}>
        Retour à mon chemin
      </Link>
    </section>
  );
}

/** Trouvée : elle la rencontre quand elle veut. */
function Trouvee() {
  return (
    <section className={`${styles.trouvee} ${m.monte}`} aria-labelledby="trouvee">
      <h1 id="trouvee" className={styles.titre}>
        {T.onATrouve}
      </h1>
      <form action={rencontrer}>
        <button type="submit" className="bouton bouton--blanc">
          La rencontrer
        </button>
      </form>
    </section>
  );
}

function Rencontre({
  autre,
  questions,
  prochaine,
  point,
  fin,
  contactEquipe,
}: {
  autre: Autre;
  questions: Question[];
  prochaine: string | null;
  point: 1 | 2 | null;
  fin: Fin;
  contactEquipe: string | null;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [confirmer, setConfirmer] = useState(false);
  const actuelle = questions[questions.length - 1];
  const passees = questions.slice(0, -1).reverse();

  return (
    <>
      <p className={styles.mention} role="note">
        {autre.mention}
      </p>
      <section className={`${styles.autre} ${m.monte}`} aria-labelledby="autre">
        <span className={styles.etiquette}>{T.Ta}</span>
        <h1 id="autre" className={styles.nom}>
          {autre.prenom}
        </h1>
        <span className={styles.quete}>
          {autre.prenom}, en chemin depuis {autre.jours} jours, sur {autre.quete}.
        </span>
        <p className={styles.phrase}>« {autre.presentation} »</p>
      </section>

      {fin ? <FinDuChemin fin={fin} autre={autre.prenom} /> : null}

      {actuelle && !fin ? <QuestionDeLaSemaine q={actuelle} autre={autre.prenom} prochaine={point ? null : prochaine} onRepondu={() => router.refresh()} /> : null}

      {/* Le point de fin de mois : chacune répond de son côté (en test, Inès dit oui) */}
      {point && !fin ? (
        <section className={`${styles.point} ${m.monte}`} aria-labelledby="point">
          <h2 id="point" className={styles.sousTitre}>
            Un mois que vous vous lisez. Envie de continuer avec {autre.prenom} ?
          </h2>
          <div className={styles.actions}>
            <form action={continuerLeMois.bind(null, point, true)}>
              <button type="submit" className="bouton">
                Oui, on continue
              </button>
            </form>
            <form action={continuerLeMois.bind(null, point, false)}>
              <button type="submit" className={styles.lien}>
                On s&apos;arrête là
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {/* Les questions passées : lisibles, repliées, la plus récente en haut */}
      {passees.length ? (
        <details className={styles.passees}>
          <summary>Les semaines d&apos;avant ({passees.length})</summary>
          <div className={`${styles.passeesListe} ${m.deplie}`}>
            {passees.map((q) => (
              <div key={q.numero} className={styles.echange}>
                <span className={styles.question}>
                  Semaine {q.numero} : {q.texte}
                </span>
                <Reponses q={q} autre={autre.prenom} />
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* « Comment ça marche » : le texte d'explication, et tout en bas, en petit, la sortie */}
      <details className={styles.comment}>
        <summary>Comment ça marche</summary>
        <div className={`${styles.commentTexte} ${m.deplie}`}>
          <ul>
            {POINTS_BUDDY.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {contactEquipe ? (
            <p className={styles.petit}>
              <a
                className={styles.lienPetit}
                href={`mailto:${contactEquipe}?subject=${encodeURIComponent("Présente ! · Quelque chose me gêne dans mon échange")}`}
              >
                Quelque chose me gêne
              </a>
              <br />
              Ton message arrive à l&apos;équipe. C&apos;est le seul cas où elle lit ton échange, et seulement celui-là, parce que tu le demandes.
            </p>
          ) : null}
          <p className={styles.petit}>
            Tu peux arrêter l&apos;échange quand tu veux.{" "}
            {confirmer ? (
              <>
                {autre.prenom} verra seulement « L&apos;échange s&apos;est arrêté. ».{" "}
                <button type="button" className={styles.lienPetit} disabled={enCours} onClick={() => demarrer(async () => (await arreterEchange(), router.refresh()))}>
                  Oui, arrêter
                </button>{" "}
                <button type="button" className={styles.lienPetit} onClick={() => setConfirmer(false)}>
                  Non
                </button>
              </>
            ) : (
              <button type="button" className={styles.lienPetit} onClick={() => setConfirmer(true)}>
                Arrêter l&apos;échange
              </button>
            )}
          </p>
        </div>
      </details>
    </>
  );
}

function Reponses({ q, autre }: { q: Question; autre: string }) {
  return (
    <div className={styles.reponses}>
      <div className={styles.reponse}>
        <span className={styles.qui}>Toi</span>
        <p>{q.maReponse}</p>
        {q.monMot ? <p className={styles.mot}>Ton mot pour elle : {q.monMot}</p> : null}
      </div>
      <div className={`${styles.reponse} ${styles.reponseAutre}`}>
        <span className={styles.qui}>{autre}</span>
        <p>{q.saReponse ?? "Pas encore de réponse."}</p>
        {q.sonMot ? <p className={styles.mot}>Un mot pour toi : {q.sonMot}</p> : null}
      </div>
    </div>
  );
}

/** « Un mot pour elle » : une seule ligne, une fois par semaine, à partir de la deuxième question. */
function MotPourElle({ numero, autre }: { numero: number; autre: string }) {
  const router = useRouter();
  const [mot, setMot] = useState("");
  const [etat, setEtat] = useState<"rien" | "envoi" | "erreur">("rien");
  return (
    <div className={styles.motPourElle}>
      <label className={styles.champ}>
        <span>
          Un mot pour {autre} <span className={styles.facultatif}>(une ligne, si tu veux)</span>
        </span>
        <input value={mot} maxLength={140} onChange={(e) => setMot(e.target.value)} className={styles.ligne} />
      </label>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.envoyer}
          disabled={!mot.trim() || etat === "envoi"}
          onClick={async () => {
            setEtat("envoi");
            const r = await laisserUnMot(numero, mot).catch(() => ({ ok: false }));
            if (r.ok) router.refresh();
            else setEtat("erreur");
          }}
        >
          Laisser ce mot
        </button>
        <span className={styles.petit}>{140 - mot.length} caractères. Pas de réponse à la réponse.</span>
      </div>
      {etat === "erreur" ? <p role="alert">Pas enregistré, réessaie.</p> : null}
    </div>
  );
}

/** La fin du chemin à deux : garder le lien, sur accord des deux. En test, aucun contact. */
function FinDuChemin({ fin, autre }: { fin: Fin; autre: string }) {
  return (
    <section className={`${styles.trouvee} ${m.monte}`} aria-labelledby="fin">
      <h2 id="fin" className={styles.titre}>
        {fin === "question" ? `Ton chemin se termine. Envie de garder le lien avec ${autre} ?` : fin === "oui" ? "Vous avez dit oui toutes les deux." : "Merci pour ces trois mois à deux."}
      </h2>
      {fin === "question" ? (
        <div className={styles.actions}>
          <form action={garderLeLien.bind(null, true)}>
            <button type="submit" className="bouton bouton--blanc">
              Oui, j&apos;aimerais
            </button>
          </form>
          <form action={garderLeLien.bind(null, false)}>
            <button type="submit" className={styles.lienBlanc}>
              Non merci
            </button>
          </form>
        </div>
      ) : fin === "oui" ? (
        <p className={styles.texte}>
          Ici, tu recevrais le contact {de(autre)}, et elle le tien (une adresse, un numéro ou un compte, celui que tu choisis). Il ne s&apos;affiche
          qu&apos;une fois et on ne le garde pas plus de trente jours. Phase de test : aucun contact n&apos;est enregistré.
        </p>
      ) : null}
    </section>
  );
}

function QuestionDeLaSemaine({ q, autre, prochaine, onRepondu }: { q: Question; autre: string; prochaine: string | null; onRepondu: () => void }) {
  const [texte, setTexte] = useState(q.maReponse);
  const [etat, setEtat] = useState<"rien" | "envoi" | "note" | "erreur">(q.maReponse ? "note" : "rien");
  const [vient, setVient] = useState(false);
  const [choisie, setChoisie] = useState<string | null>(null);

  return (
    <section className={styles.bloc} aria-labelledby="question">
      <span className={styles.etiquette}>
        Mois {Math.ceil(q.numero / 4)}, question {((q.numero - 1) % 4) + 1} sur 4 · la même pour vous deux
      </span>
      <h2 id="question" className={styles.questionTitre}>
        {q.texte}
      </h2>
      {q.maReponse && etat === "note" ? (
        <div className={vient ? m.monte : undefined}>
          <Reponses q={q} autre={autre} />
          {q.numero >= 2 && !q.monMot ? <MotPourElle numero={q.numero} autre={autre} /> : null}
          {/* La suite, dite tout de suite */}
          {prochaine ? (
            <p className={styles.suite}>
              Prochaine question <strong>{prochaine}</strong>.
            </p>
          ) : q.numero === 12 ? (
            <p className={styles.suite}>C&apos;était la dernière question de votre chemin à deux.</p>
          ) : null}
        </div>
      ) : (
        <>
          {q.phrase ? (
            <fieldset className={styles.phrases}>
              <legend>Touche la phrase {de(autre)} qui t&apos;est restée</legend>
              {q.phrasesAutre.length ? (
                q.phrasesAutre.map((ph) => (
                  <button key={ph} type="button" aria-pressed={choisie === ph} className={styles.phraseChoix} onClick={() => setChoisie(ph)}>
                    « {ph} »
                  </button>
                ))
              ) : (
                <p className={styles.petit}>Ses phrases apparaissent ici une fois que tu as répondu aux questions du mois.</p>
              )}
            </fieldset>
          ) : null}
          <label className={styles.champ}>
            <span>{q.phrase ? "Une ligne, si tu veux" : "Ta réponse, en quelques lignes"}</span>
            <textarea value={texte} rows={q.phrase ? 2 : 4} maxLength={2000} onChange={(e) => setTexte(e.target.value)} />
          </label>
          <p className={styles.petit}>La réponse {de(autre)} s&apos;affiche quand tu as répondu. Pas besoin d&apos;être au même jour.</p>
          <div className={styles.actions}>
            <button
              type="button"
              className="bouton"
              disabled={etat === "envoi" || (q.phrase ? !choisie && !texte.trim() : !texte.trim())}
              onClick={async () => {
                setEtat("envoi");
                const reponse = q.phrase ? [choisie ? `« ${choisie} »` : "", texte.trim()].filter(Boolean).join(" ") : texte;
                const r = await repondreQuestion(q.numero, q.texte, reponse).catch(() => ({ ok: false }));
                setEtat(r.ok ? "note" : "erreur");
                if (r.ok) {
                  setVient(true);
                  onRepondu();
                }
              }}
            >
              Répondre
            </button>
            {etat === "erreur" ? <span role="alert">Pas enregistré, réessaie.</span> : null}
          </div>
        </>
      )}
      {etat === "note" && vient ? <CestNote suite="Gardé dans ton carnet." /> : null}
    </section>
  );
}
