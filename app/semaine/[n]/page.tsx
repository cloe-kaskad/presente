import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { semainesDuMois } from "@/lib/chemin/textes";
import { libelleCapacite } from "@/lib/questionnaire/contenu";
import { createClient } from "@/lib/supabase/server";
import styles from "../../carte/echanger/echanger.module.css";

export const metadata = { title: "Ta semaine · Présente !" };

/** En attendant l'étape 7 : la semaine est annoncée, son contenu arrive bientôt. */
export default async function Semaine({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 12) notFound();

  const supabase = await createClient();
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (n > chemin.semaine) redirect("/chemin");

  const mois = Math.floor((n - 1) / 4) as 0 | 1 | 2;
  const caps = chemin.capacites[chemin.quetes[mois]];
  const s = semainesDuMois(mois, [libelleCapacite(caps[0]), libelleCapacite(caps[1])], chemin.mondes[mois])[(n - 1) % 4];

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
      </header>
      <main className={styles.corps}>
        <span>/ {s.etiquette}</span>
        <h1 className={styles.titre}>{s.titre}</h1>
        <p className={styles.texte}>{s.description}</p>
        <p className={styles.texte}>Le contenu de cette semaine arrive très bientôt ici.</p>
      </main>
    </div>
  );
}
