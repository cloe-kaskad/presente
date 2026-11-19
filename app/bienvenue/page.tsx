import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { createClient } from "@/lib/supabase/server";
import { Bienvenue } from "./Bienvenue";

export const metadata = { title: "Bienvenue · Présente !" };

/**
 * L'écran de passage entre la carte et son espace. Dans le vrai produit, c'est ici
 * qu'on arrivera au retour du paiement.
 */
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  if (!(await chargerChemin(supabase))) redirect("/questionnaire");
  return <Bienvenue />;
}
