import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { carteEcrite, chargerTextesCarte } from "@/lib/moteur/carte";
import { createClient } from "@/lib/supabase/server";

/** L'aiguillage après la connexion : son chemin s'il existe, sinon le questionnaire. */
export default async function Espace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profil } = await supabase.from("profiles").select("detresse_le").maybeSingle();
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  // Chemin tracé avant la nouvelle carte : on passe d'abord par « On trace ton chemin ».
  if (!carteEcrite(await chargerTextesCarte(supabase, chemin.id), chemin)) redirect("/carte/trace");
  redirect("/chemin");
}
