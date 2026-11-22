import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleValide, type TypeEvenement } from "./types";

/**
 * Note qu'une étape a été franchie (brief V0.10). Jamais de contenu. Un échec ne bloque jamais l'action
 * de l'utilisatrice et n'écrit rien de personnel dans les logs.
 * `unique` : ne note qu'une fois par semaine (et par clé), par exemple « carnet_ecrit ».
 */
export async function noter(
  supabase: SupabaseClient,
  type: TypeEvenement,
  options: { semaine?: number | null; cle?: string | null; pathId?: string | null; unique?: boolean } = {},
): Promise<void> {
  try {
    const semaine = options.semaine && options.semaine >= 1 && options.semaine <= 12 ? options.semaine : null;
    const cle = options.cle && cleValide(options.cle) ? options.cle : null;
    if (options.unique) {
      let q = supabase.from("evenements").select("id", { head: true, count: "exact" }).eq("type", type);
      q = semaine ? q.eq("semaine", semaine) : q.is("semaine", null);
      q = cle ? q.eq("cle", cle) : q;
      const { count, error } = await q;
      if (!error && (count ?? 0) > 0) return;
    }
    const { error } = await supabase.from("evenements").insert({ type, semaine, cle, path_id: options.pathId ?? null });
    // 23505 : déjà notée (une visite par jour). 42P01 : table pas encore créée. Rien de grave.
    if (error && error.code !== "23505" && error.code !== "42P01" && error.code !== "PGRST205") console.error("[mesure] étape non notée :", type, error.code);
  } catch {
    // On ne bloque jamais l'action.
  }
}
