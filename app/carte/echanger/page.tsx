import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import { Echanger } from "./Echanger";

export const metadata = { title: "Échanger une quête · Présente !" };
export const maxDuration = 60;

export default async function PageEchanger() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  const reponses = await chargerReponses(supabase, 1);

  return <Echanger positionsInitiales={reponses[2].quetes} appelle={reponses[2].appelle ?? ""} actuel={chemin.quetes} />;
}
