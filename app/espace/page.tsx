import { redirect } from "next/navigation";
import { Marque } from "@/components/Marque";
import { createClient } from "@/lib/supabase/server";
import styles from "../connexion/page.module.css";

export const metadata = { title: "Mon espace · Présente !" };

export default async function Espace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Lecture de son propre profil : la RLS garantit qu'elle ne voit que le sien.
  const { data: profil } = await supabase.from("profiles").select("prenom").maybeSingle();

  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Marque />
      </header>
      <main className={styles.corps}>
        <h1 className={styles.titre}>
          {profil?.prenom ? `Te revoilà, ${profil.prenom}.` : "Tu es connectée."}
        </h1>
        <p className={styles.intro}>
          Le questionnaire arrive très bientôt ici. Tu pourras le quitter et le reprendre quand tu
          veux : chaque réponse sera enregistrée.
        </p>
        <form action="/auth/deconnexion" method="post">
          <button type="submit" className="bouton bouton--lien">
            Me déconnecter
          </button>
        </form>
      </main>
    </div>
  );
}
