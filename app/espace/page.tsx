import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { createClient } from "@/lib/supabase/server";

/** L'aiguillage après la connexion : son chemin s'il existe, sinon le questionnaire. */
export default async function Espace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  redirect((await chargerChemin(supabase)) ? "/chemin" : "/questionnaire");
}
