import Link from "next/link";
import { redirect } from "next/navigation";
import { quatriemeMeilleure } from "@/lib/chemin/calcul";
import { chargerChemin } from "@/lib/chemin/donnees";
import { QUETE, QUETES } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import { echanger } from "../actions";
import { BoutonEnvoi } from "./BoutonEnvoi";
import styles from "./echanger.module.css";

export const metadata = { title: "Échanger une quête · Présente !" };

const ERREURS: Record<string, string> = {
  choix: "Choisis une quête à laisser de côté, et une autre pour la remplacer.",
  enregistrement: "L'échange n'a pas pu être enregistré. Réessaie dans un instant.",
};

export default async function Echanger({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  const reponses = await chargerReponses(supabase, 1);

  const proposee = quatriemeMeilleure(reponses[2].quetes, chemin.quetes);
  const autres = [proposee, ...QUETES.filter((q) => !chemin.quetes.includes(q) && q !== proposee)];

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/carte" className={styles.retour}>
          ← Ta carte
        </Link>
      </header>
      <main className={styles.corps}>
        <h1 className={styles.titre}>Échanger une quête.</h1>
        <p className={styles.texte}>
          C&apos;est ton chemin. Si une quête ne te parle pas maintenant, ouvre-en une autre : on recalcule
          l&apos;ordre pour toi.
        </p>
        {erreur && ERREURS[erreur] ? (
          <p className={styles.erreur} role="alert">
            {ERREURS[erreur]}
          </p>
        ) : null}
        <form action={echanger} className={styles.form}>
          <fieldset className={styles.groupe}>
            <legend className={styles.legende}>Laquelle laisses-tu de côté ?</legend>
            {chemin.quetes.map((q, i) => (
              <label key={q} className={styles.option}>
                <input type="radio" name="sortante" value={q} required defaultChecked={i === 2} />
                <span className={styles.rond} aria-hidden="true" />
                <span className={`titre-nom ${styles.nom}`}>{QUETE[q].nom}</span>
                <span className={styles.detail}>Mois {i + 1}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.groupe}>
            <legend className={styles.legende}>Par laquelle la remplacer ?</legend>
            {autres.map((q) => (
              <label key={q} className={styles.option}>
                <input type="radio" name="entrante" value={q} required defaultChecked={q === proposee} />
                <span className={styles.rond} aria-hidden="true" />
                <span className={`titre-nom ${styles.nom}`}>{QUETE[q].nom}</span>
                {q === proposee ? <span className={styles.detail}>la suivante sur ta carte</span> : null}
              </label>
            ))}
          </fieldset>
          <div className={styles.actions}>
            <Link href="/carte" className={styles.annuler}>
              Garder mon chemin
            </Link>
            <BoutonEnvoi />
          </div>
        </form>
      </main>
    </div>
  );
}
