import Link from "next/link";
import { redirect } from "next/navigation";
import { Marque } from "@/components/Marque";
import { ConnexionForm } from "./ConnexionForm";
import styles from "./page.module.css";

export const metadata = { title: "Se connecter · Présente !" };

const ERREURS: Record<string, string> = {
  lien: "Ce lien ne marche plus : il a peut-être déjà servi, ou il a expiré. Demande-en un nouveau.",
  liste: "Cette adresse n'est pas encore invitée. Présente! est en démo privée pour l'instant.",
  config: "La connexion n'est pas encore configurée. Réessaie un peu plus tard.",
};

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  // Déjà connectée : direction son espace.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !erreur) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/espace");
  }

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/" aria-label="Retour à l'accueil">
          <Marque />
        </Link>
      </header>
      <main className={styles.corps}>
        <h1 className={styles.titre}>On t&apos;envoie un lien.</h1>
        <p className={styles.intro}>
          Pas de mot de passe à retenir. Écris ton email, ouvre le lien qu&apos;on t&apos;envoie, et tu
          reprends là où tu t&apos;étais arrêtée.
        </p>
        <ConnexionForm erreurInitiale={erreur ? ERREURS[erreur] : undefined} />
        <p className={styles.petit}>
          Tes réponses servent uniquement à composer ton chemin.{" "}
          <Link href="/confidentialite">Ce qu&apos;on en fait</Link>.
        </p>
      </main>
    </div>
  );
}
