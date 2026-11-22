import Link from "next/link";
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
          peutOuvrirLaSuite={n < 12}
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
