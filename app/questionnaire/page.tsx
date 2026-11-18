import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import { Questionnaire } from "./Questionnaire";

export const metadata = { title: "Le questionnaire · Présente !" };

export default async function PageQuestionnaire() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Son chemin est déjà tracé : la carte.
  if (await chargerChemin(supabase)) redirect("/carte");

  const [reponses, { data: profil }] = await Promise.all([
    chargerReponses(supabase, 1),
    supabase.from("profiles").select("questionnaire_etape").maybeSingle(),
  ]);

  return (
    <Questionnaire
      initiales={reponses}
      etapeEnregistree={profil?.questionnaire_etape ?? null}
      email={user.email ?? ""}
    />
  );
}
