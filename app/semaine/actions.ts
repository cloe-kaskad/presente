"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  return { supabase, chemin };
}

/** L'étape suivante de la semaine s'ouvre. On ne revient jamais en arrière. */
export async function avancer(n: number, etape: number): Promise<{ ok: boolean }> {
  if (!Number.isInteger(n) || n < 1 || n > 12 || !Number.isInteger(etape) || etape < 0 || etape > 6) return { ok: false };
  const { supabase, chemin } = await session();
  if (n > chemin.semaine) return { ok: false };
  const actuelle = chemin.progression[String(n)] ?? 0;
  if (etape <= actuelle) return { ok: true };
  const { error } = await supabase
    .from("paths")
    .update({ progression: { ...chemin.progression, [String(n)]: etape } })
    .eq("id", chemin.id);
  if (error) console.error("[semaine] progression non enregistrée :", error.code);
  revalidatePath(`/semaine/${n}`);
  return { ok: !error };
}

/** « J'ai terminé » : la semaine est faite, la suivante s'ouvre. */
export async function terminer(n: number, etapes: number): Promise<void> {
  if (!Number.isInteger(n) || n < 1 || n > 12) redirect("/chemin");
  const { supabase, chemin } = await session();
  const maj: Record<string, unknown> = {
    progression: { ...chemin.progression, [String(n)]: Math.max(etapes, chemin.progression[String(n)] ?? 0) },
  };
  if (n === chemin.semaine && n < 12) maj.semaine_en_cours = n + 1;
  let { error } = await supabase.from("paths").update(maj).eq("id", chemin.id);
  // Avant la migration V0.4 (pas de colonne « progression ») : on avance au moins la semaine.
  if (error && maj.semaine_en_cours) ({ error } = await supabase.from("paths").update({ semaine_en_cours: maj.semaine_en_cours }).eq("id", chemin.id));
  if (error) console.error("[semaine] fin de semaine non enregistrée :", error.code);
  revalidatePath("/chemin");
  redirect("/chemin");
}
