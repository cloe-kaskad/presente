"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { HUMEURS } from "@/lib/chemin/textes";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

export async function noterHumeur(formData: FormData): Promise<void> {
  const humeur = formData.get("humeur");
  if (typeof humeur !== "string" || !(HUMEURS as readonly string[]).includes(humeur)) return;
  const { supabase, user } = await session();
  const { error } = await supabase.from("moods").insert({ user_id: user.id, humeur });
  if (error) console.error("[humeur] non enregistrée :", error.code);
  revalidatePath("/chemin");
}

/** Pour tester en une soirée : débloque la semaine suivante sans attendre le calendrier. */
export async function semaineSuivante(): Promise<void> {
  const { supabase } = await session();
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (chemin.semaine < 12) {
    const { error } = await supabase
      .from("paths")
      .update({ semaine_en_cours: chemin.semaine + 1 })
      .eq("id", chemin.id);
    if (error) console.error("[chemin] semaine suivante impossible :", error.code);
  }
  revalidatePath("/chemin");
}
