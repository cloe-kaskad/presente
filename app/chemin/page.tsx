import Link from "next/link";
import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { TraceDuMois } from "@/components/TraceDuMois";
import { decrireContenu } from "@/lib/catalogue/presentation";
import { choixDuMois, profilDeChoix } from "@/lib/catalogue/semaines";
import { chargerChemin } from "@/lib/chemin/donnees";
import { semainesDuMois } from "@/lib/chemin/textes";
import { carteEcrite, chargerTextesCarte } from "@/lib/moteur/carte";
import { MONDE, QUETE, libelleCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { citationDuJour, dateEnLettres, jourAParis } from "@/lib/rituel/citations";
import { chargerHumeurs } from "@/lib/rituel/donnees";
import { enLettres, etapesFaitesDuMois } from "@/lib/semaines/etapes";
import { createClient } from "@/lib/supabase/server";
import { semaineSuivante } from "./actions";
import { Humeur } from "./Humeur";
import styles from "./espace.module.css";

export const metadata = { title: "Mon espace · Présente !" };

export default async function MonEspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const aujourdhui = jourAParis();
  const [{ data: profil }, reponses, textesCarte, humeurs] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, temps_par_semaine, formats_preferes, sujets_a_eviter, detresse_le")
      .maybeSingle(),
    chargerReponses(supabase, 1),
    chargerTextesCarte(supabase, chemin.id),
    chargerHumeurs(supabase, aujourdhui),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  if (!carteEcrite(textesCarte, chemin)) redirect("/carte/trace");
  const humeurDuJour = humeurs.find((h) => h.jour === aujourdhui);

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
    const etat = s.numero < chemin.semaine ? "faite" : s.numero === chemin.semaine ? "active" : "avenir";
    const commencee = (chemin.progression[String(s.numero)] ?? 0) > 0;
    if (!c) return { ...s, etat, commencee };
    const suite = s.dansLeMois === 1 ? "ton carnet, puis un exercice pour ouvrir la question." : "ton carnet, puis un geste à poser dans ta semaine.";
    return { ...s, titre: c.titre, description: `${decrireContenu(c)}, ${suite}`, etat, commencee };
  });
  const active = semaines.find((s) => s.etat === "active");
  const faites = semaines.filter((s) => s.etat === "faite");
  const prochaine = semaines.find((s) => s.etat === "avenir");

  const citation = citationDuJour(aujourdhui);
  const etapes = etapesFaitesDuMois(mois, chemin.semaine, chemin.progression);
  const autresMois = [0, 1, 2].filter((m) => m > mois);
  const etiquetteActive = (e: string) => e.replace(/^Semaine \d · /, "");

  return (
    <div className={styles.page}>
      <BarreEspace courante="chemin" />

      {/* Le bandeau : la date, la citation du jour, le chemin du mois qui se dessine */}
      <section className={styles.bandeau}>
        <div className={styles.citation}>
          <span className={styles.date}>{dateEnLettres(aujourdhui)} · la citation du jour</span>
          <p className={styles.citationTexte}>« {citation.texte} »</p>
          <span className={styles.autrice}>
            <strong>{citation.autrice}</strong>, {citation.source}
          </span>
        </div>
        <div className={styles.trace}>
          <TraceDuMois faites={etapes} label={`${etapes} étapes faites sur 8 ce mois-ci`} />
          <span className={styles.traceTexte}>
            <strong>
              {QUETE[quete].nom}, mois {mois + 1} sur 3.
            </strong>{" "}
            {etapes === 0 ? "Ton mois commence." : `${enLettres(etapes)} étape${etapes > 1 ? "s" : ""} faite${etapes > 1 ? "s" : ""} sur huit.`}
            <span className={styles.ordi}> Tu en es à la semaine {chemin.semaine - mois * 4}.</span>
          </span>
        </div>
      </section>

      {/* Ton chemin, cette semaine */}
      <section className={styles.semaines}>
        <h1 className={styles.titreSection}>Ton chemin, cette semaine.</h1>
        <div className={styles.grilleSemaines}>
          {semaines.map((s) =>
            s.etat === "active" ? (
              <div key={s.numero} className={`${styles.semaine} ${styles.active}`}>
                <span className={styles.semaineEtiquette}>Cette semaine · {etiquetteActive(s.etiquette)}</span>
                <span className={styles.titreActive}>{s.titre}</span>
                <span className={styles.description}>{s.description}</span>
                <Link href={`/semaine/${s.numero}`} className={`bouton bouton--blanc ${styles.continuer}`}>
                  {s.commencee ? "Continuer" : "Commencer"}
                </Link>
              </div>
            ) : (
              <div key={s.numero} className={`${styles.semaine} ${s.etat === "faite" ? styles.faite : styles.avenir}`}>
                <span className={styles.pastille} aria-hidden="true">
                  {s.etat === "faite" ? "✓" : ""}
                </span>
                <span className={styles.semaineEtiquette}>
                  {s.etiquette}
                  <span className="sr-only">{s.etat === "faite" ? " (faite)" : " (à venir)"}</span>
                </span>
                {s.etat === "faite" ? (
                  <Link href={`/semaine/${s.numero}`} className={styles.titreSemaine}>
                    {s.titre}
                  </Link>
                ) : (
                  <span className={styles.titreSemaine}>{s.titre}</span>
                )}
              </div>
            ),
          )}
        </div>
        {/* Sur téléphone : la semaine en cours seulement, et une ligne pour le reste du mois */}
        <details className={styles.toutLeMois}>
          <summary className={styles.resume}>
            {faites.length ? `${faites.length === 1 ? "Semaine" : "Semaines"} ${faites.map((s) => s.dansLeMois).join(" et ")} ${faites.length === 1 ? "faite" : "faites"}. ` : ""}
            {prochaine ? `Ensuite : « ${prochaine.titre} ». ` : active ? "C'est la dernière semaine du mois. " : ""}
            <span className={styles.voirTout}>Voir tout le mois</span>
          </summary>
          <ol>
            {semaines.map((s) => (
              <li key={s.numero}>
                <span className={styles.semaineEtiquette}>
                  {s.etiquette}
                  {s.etat === "faite" ? " · faite" : s.etat === "active" ? " · cette semaine" : ""}
                </span>
                <span className={styles.titreLigne}>{s.titre}</span>
              </li>
            ))}
          </ol>
        </details>
      </section>

      {/* Aujourd'hui, deux minutes pour toi */}
      <section className={styles.aujourdhui}>
        <div className={styles.aujourdhuiHaut}>
          <h2 className={styles.titreSection}>Aujourd&apos;hui, deux minutes pour toi.</h2>
          <p className={styles.aujourdhuiTexte}>Rien d&apos;obligatoire. Ce que tu notes ici nourrit ton journal et ton chemin.</p>
        </div>
        <div className={styles.grilleJour}>
          <div className={styles.colonne}>
            <Humeur initiale={humeurDuJour?.humeur} noteInitiale={humeurDuJour?.note} />
          </div>
          <div className={styles.colonne} />
        </div>
        {autresMois.length ? (
          <div className={styles.ensuite}>
            <span>
              <strong>Ensuite : {autresMois.map((m) => QUETE[chemin.quetes[m]].nom).join(", puis ")}.</strong> Avec{" "}
              {autresMois.length === 2 ? "les mondes" : "le monde"} {autresMois.map((m) => MONDE[chemin.mondes[m]].nom).join(", puis ")}.
            </span>
            <Link href="/carte">Revoir ma carte</Link>
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
