import Link from "next/link";
import { allerALaFinTest, interesseeParLeCercle, proposerBuddyTest, rencontrer, repondreProposition, trouverMaBuddyTest } from "@/app/buddy/actions";
import { CestNote } from "@/components/CestNote";
import { MODE_TEST } from "@/lib/mode-test";
import { codeReponse, etatBuddy, finDuCheminADeux } from "@/lib/buddy/etat";
import { estEquipe } from "@/lib/equipe";
import { surpriseArrivee, surpriseOuverte } from "@/lib/surprise/quand";
import { declencherSurprise, ouvrirLaSuite, revenirAuStadeReel } from "./actions";
import { noter } from "@/lib/mesure/noter";
import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { TraceDuMois } from "@/components/TraceDuMois";
import m from "@/components/mouvement.module.css";
import { choixDuMois, profilDeChoix, retoursDuCarnet } from "@/lib/catalogue/semaines";
import { chargerChemin, ouvrirEspace, suivreLeCalendrier } from "@/lib/chemin/donnees";
import { semainesDuMois } from "@/lib/chemin/textes";
import { carteEcrite, chargerTextesCarte } from "@/lib/moteur/carte";
import { MONDE, QUETE, libelleCapacite } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { citationDuJour, dateEnLettres, jourAParis, plusJours } from "@/lib/rituel/citations";
import { troisJoursLourds } from "@/lib/rituel/humeurs";
import { articleDuJour, questionCherie } from "@/lib/rituel/airtable";
import { chargerHumeurs } from "@/lib/rituel/donnees";
import { echoDuJour } from "@/lib/rituel/echo";
import { candidatsEcho } from "@/lib/rituel/echo-donnees";
import { chargerCatalogue } from "@/lib/catalogue/airtable";
import { tirerLeFil } from "@/lib/catalogue/fil";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { exercicesDuChemin } from "@/lib/semaines/exercice";
import { arriveeApres, semaineFaite } from "@/lib/semaines/calendrier";
import { ecouteLe } from "@/lib/semaines/ecoute";
import { etapesDeLaSemaine, prochaineEtape } from "@/lib/semaines/etapes-semaine";
import { enLettres, etapesFaitesDuMois } from "@/lib/semaines/etapes";
import { createClient } from "@/lib/supabase/server";
import { Article } from "./Article";
import { Echo } from "./Echo";
import { QuestionCherie } from "./QuestionCherie";
import { Humeur } from "./Humeur";
import { CetteSemaine, type AutreSemaine } from "./CetteSemaine";
import { MesExercices } from "./MesExercices";
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
  await suivreLeCalendrier(supabase, chemin);
  // Une visite par jour au plus (la base refuse le doublon).
  await noter(supabase, "visite", { pathId: chemin.id, semaine: chemin.semaine });

  const aujourdhui = jourAParis();
  const [{ data: profil }, reponses, textesCarte, humeurs] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .maybeSingle(),
    chargerReponses(supabase, 1),
    chargerTextesCarte(supabase, chemin.id),
    chargerHumeurs(supabase, plusJours(aujourdhui, -3)),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  if (!carteEcrite(textesCarte, chemin)) redirect("/carte/trace");
  await ouvrirEspace(supabase, chemin);
  const humeurDuJour = humeurs.find((h) => h.jour === aujourdhui);

  // L'écho du carnet : une de ses réponses d'il y a au moins dix jours, choisie par la date.
  const [candidats, carnet, qc, article, { catalogue }] = await Promise.all([
    candidatsEcho(supabase, reponses),
    chargerCarnet(supabase),
    questionCherie(),
    articleDuJour(aujourdhui),
    chargerCatalogue(),
  ]);
  const qcReponse = qc ? carnet.find((e) => e.code === `qc:${qc.id.toLowerCase()}`) : undefined;
  const echo = echoDuJour(candidats, aujourdhui, profil?.sujets_a_eviter);
  const echoRepondu = carnet.find((e) => e.code === `echo:${aujourdhui}`);
  const [echoChoix, ...echoLigne] = (echoRepondu?.reponse ?? "").split(" · ");

  const mois = Math.min(2, Math.floor((chemin.semaine - 1) / 4)) as 0 | 1 | 2;
  const quete = chemin.quetes[mois];
  const capacites = chemin.capacites[quete];
  // Trois jours lourds de suite : on allège (contenu doux au prochain choix, geste décalable).
  const lourd = troisJoursLourds(humeurs, aujourdhui);
  const choix = await choixDuMois(supabase, chemin, mois, profilDeChoix(profil, reponses, lourd, retoursDuCarnet(carnet)));
  // Les semaines du mois et la suivante : leur étiquette et leur titre (le contenu choisi, l'épisode, ou la capacité).
  const infoSemaine = (n: number) => {
    const mo = Math.floor((n - 1) / 4) as 0 | 1 | 2;
    const q = chemin.quetes[mo];
    const caps = chemin.capacites[q];
    const sem = semainesDuMois(mo, [libelleCapacite(caps[0]), libelleCapacite(caps[1])], chemin.mondes[mo])[(n - 1) % 4];
    const c = mo === mois ? (sem.dansLeMois === 1 ? choix.s1.contenu : sem.dansLeMois === 3 ? choix.s3.contenu : null) : null;
    return { ...sem, titre: c?.titre ?? sem.titre, contenu: c };
  };
  const citation = citationDuJour(aujourdhui);
  // Tous ses exercices, pour les suivre depuis cette page sans repasser par le contenu.
  const exercices = exercicesDuChemin({
    semaineCourante: chemin.semaine,
    progression: chemin.progression,
    choix: chemin.choix,
    pratiques: new Map(catalogue.pratiques.map((p) => [p.id, { nom: p.nom, rythme: p.rythme }])),
    entrees: carnet,
    aujourdhui,
  });
  const etapes = etapesFaitesDuMois(mois, chemin.progression);

  // La carte « Cette semaine » : ses étapes, la prochaine chose à faire, la date de la suite (V0.9).
  const n = chemin.semaine;
  const cette = infoSemaine(n);
  const pratiqueDeLaSemaine = cette.dansLeMois === 1 ? choix.s1.pratique : cette.dansLeMois === 3 ? choix.s3.pratique : null;
  const entreesDeLaSemaine = carnet.filter((e) => e.semaine === n);
  const filDeLaSemaine = cette.dansLeMois === 1 || cette.dansLeMois === 3 ? await tirerLeFil(quete, cette.dansLeMois) : null;
  const etapesSemaine = etapesDeLaSemaine({
    n,
    progression: chemin.progression,
    entrees: entreesDeLaSemaine,
    contenu: cette.contenu ? { type: cette.contenu.type, format: cette.contenu.format, temps: cette.contenu.temps } : null,
    exercice: exercices.find((e) => e.n === n) ?? null,
    pratique: pratiqueDeLaSemaine ? { nom: pratiqueDeLaSemaine.nom, rythme: pratiqueDeLaSemaine.rythme } : null,
    ecoute: ecouteLe(n, chemin.progression, entreesDeLaSemaine, cette.dansLeMois === 2 || cette.dansLeMois === 4),
    fil: filDeLaSemaine ? { lu: chemin.progression[`fil${n}`] ?? null } : null,
  });
  const jourArrivee = n < 12 ? arriveeApres(n, chemin.progression, chemin.dateDebut) : null;
  const enToutesLettres = (jour: string) => {
    const t = dateEnLettres(jour);
    return t.charAt(0).toLowerCase() + t.slice(1);
  };
  const arrive = jourArrivee ? enToutesLettres(jourArrivee) : null;
  const autres: AutreSemaine[] = [];
  if (n < 12) {
    const s2 = infoSemaine(n + 1);
    autres.push({ n: n + 1, etiquette: s2.etiquette, titre: s2.titre, etat: "avenir", arrive });
  }
  for (let k = n - 1; k >= mois * 4 + 1; k--) {
    const s2 = infoSemaine(k);
    autres.push({ n: k, etiquette: s2.etiquette, titre: s2.titre, etat: semaineFaite(k, chemin.progression) ? "faite" : "a_reprendre" });
  }
  const equipe = estEquipe(user.email);
  const buddy = etatBuddy(chemin.progression, chemin.semaine);
  const finBuddy =
    buddy === "acceptee" &&
    chemin.progression.buddy_fin === undefined &&
    finDuCheminADeux(chemin.progression, carnet.some((e) => e.code === codeReponse(chemin.progression, 12) && e.reponse.trim()));
  const surprise = surpriseOuverte(chemin.progression) ? "ouverte" : surpriseArrivee(chemin.progression, chemin.dateDebut) ? "arrivee" : null;
  const sousTitre = cette.etiquette.replace(/^Semaine \d · /, "");
  const autresMois = [0, 1, 2].filter((m) => m > mois);

  return (
    <div className={styles.page}>
      <BarreEspace courante="chemin" />

      {/* Le bandeau : la date, la citation du jour, le chemin du mois qui se dessine */}
      <section className={styles.bandeau}>
        <div className={styles.citation}>
          <span className={styles.date}>{dateEnLettres(aujourdhui)} · la citation du jour</span>
          <p className={`${styles.citationTexte} ${m.monte}`}>« {citation.texte} »</p>
          <span className={styles.autrice}>
            <strong>{citation.autrice}</strong>, {citation.source}
          </span>
        </div>
        <div className={styles.trace}>
          <TraceDuMois anime faites={etapes} label={`${etapes} étapes faites sur 8 ce mois-ci`} />
          <span className={styles.traceTexte}>
            <strong>
              {QUETE[quete].nom}, mois {mois + 1} sur 3.
            </strong>{" "}
            {etapes === 0 ? "Ton mois commence." : `${enLettres(etapes)} étape${etapes > 1 ? "s" : ""} faite${etapes > 1 ? "s" : ""} sur huit.`}
            <span className={styles.ordi}> Tu en es à la semaine {chemin.semaine - mois * 4}.</span>
          </span>
        </div>
      </section>

      {/* La surprise du dixième jour : une carte à grain, puis un petit lien une fois ouverte */}
      {surprise === "arrivee" ? (
        <section className={`${styles.surprise} ${m.monte}`} style={{ animationDelay: "0.3s" }} aria-labelledby="surprise">
          <h2 id="surprise" className={styles.surpriseTitre}>
            Une surprise pour toi.
          </h2>
          <Link href="/surprise" className="bouton bouton--blanc">
            Ouvrir
          </Link>
        </section>
      ) : surprise === "ouverte" ? (
        <p className={styles.maSurprise}>
          <Link href="/surprise">Ma surprise</Link>
        </p>
      ) : null}

      {/* La buddy : la proposition (semaine 3, ou depuis le panneau de test), puis un petit lien */}
      {buddy === "proposee" ? (
        <section className={`${styles.buddy} ${m.monte}`} style={{ animationDelay: "0.35s" }} aria-labelledby="buddy">
          <h2 id="buddy" className={styles.buddyTitre}>
            Envie de faire un bout de chemin à deux ?
          </h2>
          <p className={styles.buddyTexte}>Une autre femme en chemin, une question par semaine, la même pour vous deux.</p>
          <div className={styles.buddyActions}>
            <Link href="/buddy" className="bouton">
              Oui, dites-m&apos;en plus
            </Link>
            <form action={repondreProposition.bind(null, false)}>
              <button type="submit" className={styles.buddyNon}>
                Pas maintenant
              </button>
            </form>
          </div>
        </section>
      ) : buddy === "recherche" ? (
        <p className={styles.attenteBuddy}>On cherche ta buddy.</p>
      ) : buddy === "trouvee" ? (
        <section className={`${styles.surprise} ${m.monte}`} style={{ animationDelay: "0.35s" }} aria-labelledby="buddy-trouvee">
          <h2 id="buddy-trouvee" className={styles.surpriseTitre}>
            On a trouvé ta buddy.
          </h2>
          <form action={rencontrer}>
            <button type="submit" className="bouton bouton--blanc">
              La rencontrer
            </button>
          </form>
        </section>
      ) : buddy === "acceptee" ? (
        <p className={styles.maSurprise}>
          <Link href="/buddy">Ma buddy</Link>
        </p>
      ) : null}

      {/* La fin du chemin à deux */}
      {finBuddy ? (
        <section className={`${styles.surprise} ${m.monte}`} style={{ animationDelay: "0.4s" }} aria-labelledby="buddy-fin">
          <h2 id="buddy-fin" className={styles.surpriseTitre}>
            Ton chemin se termine. Envie de garder le lien avec Inès ?
          </h2>
          <Link href="/buddy" className="bouton bouton--blanc">
            Répondre
          </Link>
        </section>
      ) : null}

      {/* Le cercle de parole, « comme si », au début du mois 2 */}
      {chemin.semaine >= 5 && chemin.semaine <= 8 ? (
        <section className={`${styles.cercle} ${m.monte}`} style={{ animationDelay: "0.45s" }} aria-labelledby="cercle">
          {MODE_TEST ? <span className={styles.cercleTest}>Phase de test</span> : null}
          <h2 id="cercle" className={styles.buddyTitre}>
            Ton premier cercle.
          </h2>
          <p className={styles.buddyTexte}>
            Six femmes en chemin, 1 h 15, à Kaskad République ou en visio.{buddy === "acceptee" ? " Ta buddy y sera." : ""}
          </p>
          {chemin.progression.cercle ? (
            <CestNote anime={false} suite="On te tient au courant." />
          ) : (
            <form action={interesseeParLeCercle}>
              <button type="submit" className="bouton">
                Je veux en être
              </button>
            </form>
          )}
        </section>
      ) : null}

      {/* Mes exercices en cours, juste sous le bandeau */}
      <MesExercices exercices={exercices} />

      {/* Ton chemin, cette semaine */}
      <section className={styles.semaines}>
        <h1 className={styles.titreSection}>Ton chemin, cette semaine.</h1>
        <CetteSemaine
          n={n}
          etiquette={`Cette semaine · semaine ${cette.dansLeMois} · ${sousTitre}`}
          titre={cette.titre}
          etapes={etapesSemaine}
          prochaine={prochaineEtape(etapesSemaine)}
          arrive={arrive}
          exerciceEnCours={exercices.some((e) => e.etat === "en_cours")}
          allege={
            lourd && (cette.dansLeMois === 1 || cette.dansLeMois === 3)
              ? `Ces derniers jours ont l'air lourds. Tu peux décaler ${cette.dansLeMois === 3 ? "le geste" : "l'exercice"} de cette semaine : il t'attendra.`
              : null
          }
          autres={autres}
        />
      </section>

      {/* Aujourd'hui, deux minutes pour toi */}
      <section className={styles.aujourdhui}>
        <div className={styles.aujourdhuiHaut}>
          <h2 className={styles.titreSection}>Aujourd&apos;hui, deux minutes pour toi.</h2>
          <p className={styles.aujourdhuiTexte}>Rien d&apos;obligatoire. Ce que tu notes ici nourrit ton journal et ton chemin.</p>
        </div>
        <div className={styles.grilleJour}>
          <div className={`${styles.colonne} ${m.monte}`} style={{ animationDelay: "0.75s" }}>
            <Humeur initiale={humeurDuJour?.humeur} noteInitiale={humeurDuJour?.note} />
            {echo ? (
              <Echo
                semaine={chemin.semaine}
                jour={aujourdhui}
                dateEcrite={dateEnLettres(echo.jour).replace(/^\S+ /, "")}
                mots={echo.reponse}
                dejaChoisi={echoRepondu ? echoChoix : undefined}
                dejaLigne={echoRepondu ? echoLigne.join(" · ") : undefined}
              />
            ) : null}
          </div>
          <div className={`${styles.colonne} ${m.monte}`} style={{ animationDelay: "0.84s" }}>
            {qc ? (
              <QuestionCherie
                semaine={chemin.semaine}
                id={qc.id}
                question={qc.question}
                lien={qc.lien}
                reponseInitiale={qcReponse?.reponse}
                abonnee={Boolean(profil?.newsletter)}
              />
            ) : null}
            {article ? <Article article={article} /> : null}
          </div>
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

      {/* Le panneau de test : l'équipe seulement (EQUIPE_EMAILS), invisible pour toute autre personne */}
      {equipe ? (
        <details className={styles.modeTest}>
          <summary>Mode test</summary>
          <div className={styles.modeTestLiens}>
            {n < 12 ? (
              <form action={ouvrirLaSuite}>
                <button type="submit">Ouvrir la suite maintenant</button>
              </form>
            ) : null}
            <form action={declencherSurprise}>
              <button type="submit">Déclencher la surprise</button>
            </form>
            <form action={proposerBuddyTest}>
              <button type="submit">Recommencer la buddy depuis le début</button>
            </form>
            <form action={allerALaFinTest}>
              <button type="submit">Aller à la fin du chemin à deux</button>
            </form>
            {buddy === "recherche" ? (
              <form action={trouverMaBuddyTest}>
                <button type="submit">Trouver ma buddy maintenant</button>
              </form>
            ) : null}
            <form action={revenirAuStadeReel}>
              <button type="submit">Revenir au stade réel</button>
            </form>
            <Link href="/equipe">Voir l&apos;engagement</Link>
          </div>
        </details>
      ) : null}

      <footer className={styles.pied}>
        <form action="/auth/deconnexion" method="post">
          <button type="submit" className={styles.discret}>
            Me déconnecter
          </button>
        </form>
      </footer>
    </div>
  );
}
