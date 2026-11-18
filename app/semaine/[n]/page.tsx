import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { decrireContenu } from "@/lib/catalogue/presentation";
import { choixDuMois, profilDeChoix } from "@/lib/catalogue/semaines";
import { chargerChemin } from "@/lib/chemin/donnees";
import { semainesDuMois } from "@/lib/chemin/textes";
import { libelleCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import styles from "./semaine.module.css";

export const metadata = { title: "Ta semaine · Présente !" };

const VERBE: Record<string, string> = {
  ecouter: "Écouter",
  lire: "Lire",
  regarder: "Regarder",
  faire: "Découvrir",
};

export default async function Semaine({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 12) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (n > chemin.semaine) redirect("/chemin");

  const mois = Math.floor((n - 1) / 4) as 0 | 1 | 2;
  const dansLeMois = ((n - 1) % 4) + 1;
  const caps = chemin.capacites[chemin.quetes[mois]];
  const s = semainesDuMois(mois, [libelleCapacite(caps[0]), libelleCapacite(caps[1])], chemin.mondes[mois])[dansLeMois - 1];

  let quete: Awaited<ReturnType<typeof choixDuMois>>["s1"] | null = null;
  let indisponible = false;
  if (dansLeMois === 1 || dansLeMois === 3) {
    const [{ data: profil }, reponses] = await Promise.all([
      supabase.from("profiles").select("temps_par_semaine, formats_preferes, sujets_a_eviter").maybeSingle(),
      chargerReponses(supabase, 1),
    ]);
    const choix = await choixDuMois(supabase, chemin, mois, profilDeChoix(profil, reponses));
    quete = dansLeMois === 1 ? choix.s1 : choix.s3;
    indisponible = choix.catalogueIndisponible;
  }

  const contenu = quete?.contenu;
  const pratique = quete?.pratique;

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
      </header>
      <main className={styles.corps}>
        <span className={styles.surtitre}>
          <span className={styles.slash}>/</span> {s.etiquette}
        </span>
        <h1 className={styles.titre}>{contenu?.titre ?? s.titre}</h1>

        {quete ? (
          <>
            {contenu ? (
              <section className={styles.carte} aria-labelledby="contenu-titre">
                <span className={styles.surtitre} id="contenu-titre">
                  1. Le contenu
                </span>
                {contenu.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contenu.image} alt="" className={styles.image} />
                ) : null}
                <p className={styles.texte}>
                  {decrireContenu(contenu)}
                  {contenu.auteur ? (
                    <>
                      {" "}
                      · <span className={styles.auteur}>{contenu.auteur}</span>
                    </>
                  ) : null}
                </p>
                {contenu.description ? <p className={styles.description}>{contenu.description}</p> : null}
                {contenu.lien ? (
                  <a href={contenu.lien} target="_blank" rel="noopener noreferrer" className="bouton">
                    {VERBE[contenu.format ?? ""] ?? "Ouvrir"}
                    <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                  </a>
                ) : null}
              </section>
            ) : (
              <p className={styles.manque}>
                {indisponible
                  ? "Le catalogue est momentanément indisponible. Réessaie dans quelques minutes."
                  : "Aucun contenu validé ne correspond encore à cette semaine. Il en faut un dans Airtable pour cette quête."}
              </p>
            )}

            <section className={styles.carte} aria-labelledby="carnet-titre">
              <span className={styles.surtitre} id="carnet-titre">
                2. Ton carnet
              </span>
              <p className={styles.texte}>Trois questions courtes, juste après. Elles arrivent très bientôt ici.</p>
            </section>

            {pratique ? (
              <section className={`${styles.carte} ${styles.cartePleine}`} aria-labelledby="pratique-titre">
                <span className={styles.surtitre} id="pratique-titre">
                  3. {dansLeMois === 1 ? "L'exercice" : "L'acte, dans ta vraie vie"}
                </span>
                <h2 className={styles.nomPratique}>{pratique.nom}</h2>
                {pratique.enBref ? <p className={styles.texte}>{pratique.enBref}</p> : null}
                {pratique.rythme ? <p className={styles.rythme}>{pratique.rythme}</p> : null}
              </section>
            ) : (
              <p className={styles.manque}>
                {indisponible
                  ? "Le catalogue est momentanément indisponible."
                  : `Aucune pratique validée avec le rôle « ${dansLeMois === 1 ? "Ouvrir" : "Agir"} » pour cette quête dans Airtable.`}
              </p>
            )}
          </>
        ) : (
          <>
            <p className={styles.texte}>{s.description}</p>
            <p className={styles.texte}>L&apos;épisode de cette semaine arrive très bientôt ici.</p>
          </>
        )}
      </main>
    </div>
  );
}
