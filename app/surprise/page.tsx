import Link from "next/link";
import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { chargerChemin } from "@/lib/chemin/donnees";
import { noter } from "@/lib/mesure/noter";
import { MODE_TEST } from "@/lib/mode-test";
import { AVANTAGES, MOT_DE_LA_CARTE } from "@/lib/surprise/avantages";
import { surpriseArrivee } from "@/lib/surprise/quand";
import { createClient } from "@/lib/supabase/server";
import { Enveloppe } from "./Enveloppe";
import m from "@/components/mouvement.module.css";
import styles from "./surprise.module.css";

export const metadata = { title: "Une surprise pour toi · Présente !" };

/** La surprise « comme si » (brief V0.10) : ce qu'une vraie cliente recevrait chez elle au dixième jour. */
export default async function Surprise() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (!surpriseArrivee(chemin.progression, chemin.dateDebut)) redirect("/chemin");

  // Ouverte : elle reste accessible depuis Mon chemin (« Ma surprise »).
  const premiereFois = !chemin.progression.surprise_vue;
  if (premiereFois) {
    const progression = { ...chemin.progression, surprise_vue: Math.floor(Date.now() / 1000) };
    await supabase.from("paths").update({ progression }).eq("id", chemin.id);
    await noter(supabase, "surprise_vue", { pathId: chemin.id, unique: true });
  }

  return (
    <>
      <BarreEspace courante="chemin" />
      <main className={styles.page}>
        {MODE_TEST ? (
          <p className={styles.test}>
            <strong>Phase de test.</strong> Si tu étais déjà cliente, voici ce que tu recevrais chez toi cette semaine.
          </p>
        ) : null}
        <div className={styles.tete}>
          <Link href="/chemin" className={styles.retour}>
            ← Mon chemin
          </Link>
          <h1 className={styles.titre}>Une surprise pour toi.</h1>
        </div>

        <Enveloppe mot={MOT_DE_LA_CARTE} animer={premiereFois} />

        <section className={styles.avantages} aria-labelledby="avantages">
          <h2 id="avantages" className={styles.sousTitre}>
            De quoi continuer
          </h2>
          <div className={styles.grille}>
            {AVANTAGES.map((a, i) => (
              <article key={a.titre} className={`${styles.avantage} ${m.monte}`} style={{ animationDelay: `${(premiereFois ? 1.6 : 0.1) + i * 0.12}s` }}>
                {MODE_TEST ? <span className={styles.exemple}>exemple, partenariat à confirmer</span> : null}
                <h3 className={styles.avantageTitre}>{a.titre}</h3>
                <p className={styles.avantageDetail}>{a.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <Link href="/chemin" className={`bouton ${styles.continuer}`}>
          Retour à mon chemin
        </Link>
      </main>
    </>
  );
}
