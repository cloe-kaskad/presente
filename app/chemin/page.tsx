import Link from "next/link";
import { redirect } from "next/navigation";
import { Marque } from "@/components/Marque";
import { chargerChemin } from "@/lib/chemin/donnees";
import { HUMEURS, prenomAffiche, semainesDuMois } from "@/lib/chemin/textes";
import { carteEcrite, chargerTextesCarte, texte } from "@/lib/moteur/carte";
import { MONDE, QUETE, libelleCapacite } from "@/lib/questionnaire/contenu";
import { decrireContenu } from "@/lib/catalogue/presentation";
import { choixDuMois, profilDeChoix } from "@/lib/catalogue/semaines";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import { noterHumeur, semaineSuivante } from "./actions";
import styles from "./chemin.module.css";

export const metadata = { title: "Mon chemin · Présente !" };

export default async function Chemin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const [{ data: profil }, { data: humeurs }, reponses] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, temps_par_semaine, formats_preferes, sujets_a_eviter, detresse_le")
      .maybeSingle(),
    supabase
      .from("moods")
      .select("humeur")
      .gte("created_at", debutJour.toISOString())
      .order("created_at", { ascending: false })
      .limit(1),
    chargerReponses(supabase, 1),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  const textesCarte = await chargerTextesCarte(supabase, chemin.id);
  if (!carteEcrite(textesCarte, chemin)) redirect("/carte/trace");
  const capaciteDite = (c: Parameters<typeof libelleCapacite>[0]) => texte(textesCarte, "capacite", c) ?? libelleCapacite(c);
  const humeurDuJour = humeurs?.[0]?.humeur as string | undefined;

  const mois = Math.min(2, Math.floor((chemin.semaine - 1) / 4)) as 0 | 1 | 2;
  const quete = chemin.quetes[mois];
  const capacites = chemin.capacites[quete];
  const choix = await choixDuMois(supabase, chemin, mois, profilDeChoix(profil, reponses));
  const semaines = semainesDuMois(
    mois,
    [libelleCapacite(capacites[0]), libelleCapacite(capacites[1])],
    chemin.mondes[mois],
  ).map((s) => {
    // Semaines 1 et 3 : le titre du contenu choisi pour elle.
    const c = s.dansLeMois === 1 ? choix.s1.contenu : s.dansLeMois === 3 ? choix.s3.contenu : null;
    if (!c) return s;
    const suite = s.dansLeMois === 1 ? "ton carnet, puis un exercice pour ouvrir la question." : "ton carnet, puis un geste à poser dans ta semaine.";
    return { ...s, titre: c.titre, description: `${decrireContenu(c)}, ${suite}` };
  });
  const autresMois = [0, 1, 2].filter((m) => m > mois);
  const prenom = prenomAffiche(profil?.prenom);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.haut}>
          <Marque />
          <nav className={styles.nav} aria-label="Navigation principale">
            <Link href="/chemin" aria-current="page">
              Mon chemin
            </Link>
            <Link href="/carte">Ma carte</Link>
          </nav>
        </div>
        <div className={styles.heroBas}>
          <div className={styles.heroTitre}>
            <span className={styles.surtitre}>
              / {prenom ? `Le chemin de ${prenom}` : "Ton chemin"} · mois {mois + 1} sur 3
            </span>
            <h1 className={`titre-nom ${styles.nomQuete}`}>{QUETE[quete].nom}</h1>
          </div>
          <div className={styles.ceMois}>
            <span className={styles.surtitre}>/ Ce mois-ci</span>
            <span className={styles.ceMoisTexte}>
              {capaciteDite(capacites[0])}. {capaciteDite(capacites[1])}.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.semaines} aria-label={`Les semaines du mois ${mois + 1}`}>
        {semaines.map((s) => {
          const etat = s.numero < chemin.semaine ? "faite" : s.numero === chemin.semaine ? "active" : "avenir";
          if (etat === "active") {
            return (
              <div key={s.numero} className={`${styles.semaine} ${styles.active}`}>
                <span className={styles.surtitre}>/ Cette semaine · {s.etiquette.replace(/^Semaine \d · /, "")}</span>
                <span className={styles.titreActive}>{s.titre}</span>
                <span className={styles.description}>{s.description}</span>
                <Link href={`/semaine/${s.numero}`} className={`bouton bouton--blanc ${styles.commencer}`}>
                  Commencer
                </Link>
              </div>
            );
          }
          return (
            <div key={s.numero} className={`${styles.semaine} ${etat === "faite" ? styles.faite : styles.avenir}`}>
              <span className={styles.pastille} aria-hidden="true">
                {etat === "faite" ? "✓" : ""}
              </span>
              <div className={styles.semaineTexte}>
                <span className={styles.surtitre}>
                  <span className={styles.slash}>/</span> {s.etiquette}
                  <span className="sr-only">{etat === "faite" ? " (faite)" : " (à venir)"}</span>
                </span>
                <span className={styles.titreSemaine}>{s.titre}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.bas}>
        <div className={styles.humeur}>
          <h2 className={styles.humeurTitre}>Comment tu vas, aujourd&apos;hui ?</h2>
          <form action={noterHumeur} className={styles.humeurs}>
            {HUMEURS.map((h) => (
              <button
                key={h}
                type="submit"
                name="humeur"
                value={h}
                className={`${styles.puce} ${humeurDuJour === h ? styles.puceChoisie : ""}`}
                aria-pressed={humeurDuJour === h}
              >
                {h}
              </button>
            ))}
          </form>
        </div>
        {autresMois.length ? (
          <div className={styles.suite}>
            <span className={styles.surtitre}>
              <span className={styles.slash}>/</span> {autresMois.length === 2 ? "Mois 2 et 3" : "Mois 3"}
            </span>
            <span className={styles.suiteTitre}>
              {autresMois.map((m) => QUETE[chemin.quetes[m]].nom).join(", puis ")}
            </span>
            <span className={styles.suiteTexte}>
              avec {autresMois.map((m) => MONDE[chemin.mondes[m]].nom).join(", puis ")}.{" "}
              {autresMois.length === 2 ? "Ils s'ajusteront" : "Il s'ajustera"} à ce que tu écris ce mois-ci.
            </span>
          </div>
        ) : null}
      </section>

      <footer className={styles.pied}>
        <form action={semaineSuivante}>
          <button type="submit" className={styles.discret} disabled={chemin.semaine >= 12}>
            Passer à la semaine suivante (test)
          </button>
        </form>
        <form action="/auth/deconnexion" method="post">
          <button type="submit" className={styles.discret}>
            Me déconnecter
          </button>
        </form>
      </footer>
    </div>
  );
}
