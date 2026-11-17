"use server";

import { redirect } from "next/navigation";
import { echangerQuete } from "@/lib/chemin/calcul";
import { chargerChemin } from "@/lib/chemin/donnees";
import { dependancesIA } from "@/lib/chemin/lecture-ia";
import { isQueteId } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";

export async function echanger(formData: FormData): Promise<void> {
  const sortante = formData.get("sortante");
  const entrante = formData.get("entrante");
  if (!isQueteId(sortante) || !isQueteId(entrante)) redirect("/carte/echanger?erreur=choix");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (!chemin.quetes.includes(sortante) || chemin.quetes.includes(entrante)) {
    redirect("/carte/echanger?erreur=choix");
  }

  const reponses = await chargerReponses(supabase, 1);
  const nouveau = await echangerQuete(
    chemin,
    sortante,
    entrante,
    { positions: reponses[2].quetes, appelle: reponses[2].appelle, zoom: reponses[3].zoom },
    dependancesIA(reponses),
  );

  const { error } = await supabase
    .from("paths")
    .update({ quetes: nouveau.quetes, capacites: nouveau.capacites })
    .eq("id", chemin.id);
  if (error) {
    console.error("[chemin] échange impossible :", error.code);
    redirect("/carte/echanger?erreur=enregistrement");
  }
  redirect("/carte");
}
