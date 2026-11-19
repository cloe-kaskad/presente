"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { detecterDetresse } from "@/lib/moteur/ecriture";
import { jourAParis } from "@/lib/rituel/citations";
import { estHumeur } from "@/lib/rituel/humeurs";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

/**
 * L'humeur du jour, avec une phrase facultative. Une entrée par jour, modifiable dans la journée.
 * La phrase passe par la détection de détresse. Rien n'est écrit dans les logs.
 */
export async function noterHumeur(humeur: string, note: string): Promise<{ ok: boolean; detresse?: boolean }> {
  if (!estHumeur(humeur)) return { ok: false };
  const phrase = note.trim().slice(0, 300);
  const { supabase, user } = await session();

  if (phrase && (await detecterDetresse([{ question: "Comment tu vas, aujourd'hui ? Pourquoi, en une phrase ?", reponse: phrase }]))) {
    await supabase.from("profiles").update({ detresse_le: new Date().toISOString() }).eq("id", user.id);
    return { ok: true, detresse: true };
  }

  const jour = jourAParis();
  const { error } = await supabase
    .from("moods")
    .upsert({ user_id: user.id, jour, humeur, note: phrase || null }, { onConflict: "user_id,jour" });
  if (error) {
    // Avant la migration V0.5 (pas de colonne « jour » ni « note ») : on garde au moins l'humeur.
    const { error: e2 } = await supabase.from("moods").insert({ user_id: user.id, humeur });
    if (e2) {
      console.error("[humeur] non enregistrée :", e2.code);
      return { ok: false };
    }
  }
  revalidatePath("/chemin");
  revalidatePath("/journal");
  return { ok: true };
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
