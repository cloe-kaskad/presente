import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { AvecSesMots } from "@/components/AvecSesMots";
import { dateEnLettres, jourAParis } from "@/lib/rituel/citations";
import { chargerHumeurs, chargerMesMots } from "@/lib/rituel/donnees";
import { LEGENDE, MOT_A_TOI, couleurDe } from "@/lib/rituel/humeurs";
import { resumeDeLaSemaine } from "@/lib/rituel/journal";
import { createClient } from "@/lib/supabase/server";
import { Humeur } from "@/app/chemin/Humeur";
import { Calendrier } from "./Calendrier";
import styles from "./journal.module.css";

export const metadata = { title: "Mon journal · Présente !" };
export const maxDuration = 120;

export default async function Journal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profil } = await supabase.from("profiles").select("sujets_a_eviter, detresse_le").maybeSingle();
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");

  const aujourdhui = jourAParis();
  const debutDuMois = `${aujourdhui.slice(0, 7)}-01`;
  // Le mois en cours, plus la semaine passée pour le résumé.
  const depuis = new Date(Date.parse(`${debutDuMois}T12:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10);
  const [humeurs, mesMots] = await Promise.all([chargerHumeurs(supabase, depuis), chargerMesMots(supabase)]);
  const resume = await resumeDeLaSemaine(supabase, user.id, humeurs, aujourdhui, profil?.sujets_a_eviter ?? null);
  if (resume.detresse) {
    await supabase.from("profiles").update({ detresse_le: new Date().toISOString() }).eq("id", user.id);
    redirect("/quand-ca-ne-va-pas");
  }

  const duMois = humeurs.filter((h) => h.jour >= debutDuMois);
  const duJour = humeurs.find((h) => h.jour === aujourdhui);
  const nomDuMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${debutDuMois}T12:00:00Z`),
  );

  return (
    <>
      <BarreEspace courante="journal" />
      <main className={styles.page}>
        <div className={styles.haut}>
          <h1 className={`titre-nom ${styles.titre}`}>Journal</h1>
          <span className={styles.compte}>
            {nomDuMois.charAt(0).toUpperCase() + nomDuMois.slice(1)} · {duMois.length} jour{duMois.length > 1 ? "s" : ""} noté
            {duMois.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Noter sa journée sans repasser par Mon chemin (brief V0.12) ; sur ordinateur, à gauche de la relecture */}
        <div className={`${styles.dessus} ${resume.texte ? styles.dessusDeux : ""}`}>
          <Humeur initiale={duJour?.humeur} noteInitiale={duJour?.note} mesMots={mesMots} surJournal />
          {resume.texte ? (
            <section className={styles.relue} aria-labelledby="relue">
              <h2 id="relue" className={styles.relueTitre}>
                Ta semaine, relue
              </h2>
              <p className={styles.relueTexte}>
                <AvecSesMots texte={resume.texte} fond="blanc" />
              </p>
              <p className={styles.relueNote}>C&apos;est une lecture, pas un verdict. Personne de l&apos;équipe ne lit ton journal.</p>
            </section>
          ) : null}
        </div>

        <div className={styles.colonnes}>
          <section aria-labelledby="mois">
            <h2 id="mois" className={styles.sousTitre}>
              Ton mois, d&apos;un coup d&apos;œil.
            </h2>
            <Calendrier
              debutDuMois={debutDuMois}
              aujourdhui={aujourdhui}
              jours={duMois.map((h) => ({ jour: h.jour, humeur: h.humeur, note: h.note }))}
            />
            <ul className={styles.legende} aria-label="Légende">
              {LEGENDE.map((l) => (
                <li key={l.label}>
                  <i style={{ background: l.couleur }} aria-hidden="true" />
                  {l.label}
                </li>
              ))}
              <li>
                <i style={{ background: MOT_A_TOI.fond, border: `1.5px solid ${MOT_A_TOI.bord}` }} aria-hidden="true" />
                {MOT_A_TOI.famille}
              </li>
            </ul>
          </section>

          <section aria-labelledby="note">
            <h2 id="note" className={styles.sousTitre}>
              Ce que tu as noté.
            </h2>
            {duMois.length ? (
              <ol className={styles.liste}>
                {duMois.map((h) => (
                  <li key={h.jour}>
                    <i style={{ background: couleurDe(h.humeur).fond, ...(couleurDe(h.humeur).bord ? { border: `1.5px solid ${couleurDe(h.humeur).bord}` } : {}) }} aria-hidden="true" />
                    <div>
                      <span className={styles.listeDate}>
                        {dateEnLettres(h.jour)} · {h.humeur}
                      </span>
                      {h.note ? <p className={styles.listeNote} data-sien="">{h.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.vide}>Rien encore ce mois-ci. Ton humeur du jour se note juste au-dessus, en deux secondes.</p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
