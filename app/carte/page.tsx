import Link from "next/link";
import { redirect } from "next/navigation";
import { position } from "@/lib/chemin/calcul";
import { chargerChemin } from "@/lib/chemin/donnees";
import { ETIQUETTE_MOIS, pourquoiSecours } from "@/lib/chemin/textes";
import { MONDE, QUETE, QUETES, libelleCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import styles from "./carte.module.css";

export const metadata = { title: "Ta carte · Présente !" };

const STYLE_MOIS = [styles.moisPlein, styles.moisContour, styles.moisCiel];

export default async function Carte() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const [reponses, { data: profil }, { data: textes }] = await Promise.all([
    chargerReponses(supabase, 1),
    supabase.from("profiles").select("prenom, sujets_a_eviter").maybeSingle(),
    supabase
      .from("generated_texts")
      .select("cle, texte")
      .eq("path_id", chemin.id)
      .eq("emplacement", "carte_pourquoi"),
  ]);

  const ecrits = new Map((textes ?? []).map((t) => [t.cle, t.texte as string]));
  const prenom = profil?.prenom?.trim();
  const [cap1, cap2] = chemin.capacites[chemin.quetes[0]];

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/chemin" className={`titre-nom ${styles.marque}`}>
          Présente&nbsp;!
        </Link>
      </header>

      <section className={styles.intro}>
        <div className={styles.introTitre}>
          <span className={styles.surtitre}>
            <span className={styles.slash}>/</span> Ta carte
          </span>
          <h1 className={styles.titre}>{prenom ? `${prenom}, voici ton chemin.` : "Voici ton chemin."}</h1>
        </div>
        <p className={styles.chapo}>Trois mois, trois quêtes, trois mondes. Il s&apos;ajustera à ce que tu écriras en route.</p>
      </section>

      <section className={styles.mois} aria-label="Tes trois quêtes, dans l'ordre">
        {chemin.quetes.map((q, i) => {
          const ecrit = ecrits.get(q);
          const secours = pourquoiSecours(i as 0 | 1 | 2, reponses[3].zoom[q]?.autrement, profil?.sujets_a_eviter);
          return (
            <article key={q} className={`${styles.carteMois} ${STYLE_MOIS[i]}`}>
              <div className={styles.carteHaut}>
                <span className={styles.etiquette}>{ETIQUETTE_MOIS[i]}</span>
                <span className={styles.monde}>+ {MONDE[chemin.mondes[i]].nom}</span>
              </div>
              <h2 className={`titre-nom ${styles.nomQuete}`}>{QUETE[q].nom}</h2>
              <p className={styles.pourquoi}>
                {ecrit ? (
                  ecrit
                ) : (
                  <>
                    {secours.citation ? (
                      <>
                        Tu as écrit <span className={styles.sesMots}>« {secours.citation} »</span>.{" "}
                      </>
                    ) : null}
                    {secours.suite}
                  </>
                )}
              </p>
            </article>
          );
        })}
      </section>

      <section className={styles.bande}>
        <div className={styles.capacites}>
          <span className={styles.surtitre}>
            <span className={styles.slash}>/</span> Ce mois-ci, deux capacités
          </span>
          {[cap1, cap2].map((c) => (
            <p key={c} className={styles.capacite}>
              <span aria-hidden="true">/</span>
              <span>{libelleCapacite(c)}</span>
            </p>
          ))}
        </div>
        <div className={styles.boutons}>
          <Link href="/chemin" className="bouton bouton--grand">
            Voir mon chemin
          </Link>
          <Link href="/carte/echanger" className={`bouton bouton--grand ${styles.boutonContour}`}>
            Échanger une quête
          </Link>
        </div>
      </section>

      <section className={styles.sept} aria-labelledby="sept-titre">
        <span className={styles.surtitre} id="sept-titre">
          <span className={styles.slash}>/</span> Tes sept quêtes, là où tu t&apos;es située
        </span>
        <ul className={styles.liste}>
          {QUETES.map((q) => {
            const ou = position(reponses[2].quetes, q).ou;
            const mois = chemin.quetes.indexOf(q);
            return (
              <li key={q} className={`${styles.ligne} ${mois >= 0 ? styles.ligneChoisie : ""}`}>
                <div className={styles.ligneHaut}>
                  <span className={`titre-nom ${styles.ligneNom}`}>{QUETE[q].nom}</span>
                  {mois >= 0 ? <span className={styles.ligneMois}>Mois {mois + 1}</span> : null}
                </div>
                <div
                  className={styles.piste}
                  role="img"
                  aria-label={`${QUETE[q].nom} : ${ou} sur 5, entre « ${QUETE[q].gauche} » et « ${QUETE[q].droite} »`}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <span key={v} className={`${styles.cran} ${v === ou ? styles.cranIci : ""}`} />
                  ))}
                </div>
                <div className={styles.bornes} aria-hidden="true">
                  <span>{QUETE[q].gauche}</span>
                  <span>{QUETE[q].droite}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
