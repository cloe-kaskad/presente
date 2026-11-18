import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lirePartie, reponsesVides, type NumeroPartie, type Reponses } from "./reponses";

/** Toutes ses réponses d'un passage (1 = entrée). La RLS garantit qu'on ne lit que les siennes. */
export async function chargerReponses(supabase: SupabaseClient, passage = 1): Promise<Reponses> {
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("partie, reponses")
    .eq("passage", passage);
  if (error) throw new Error(`Lecture des réponses impossible (${error.code})`);
  const r = reponsesVides();
  for (const ligne of data ?? []) {
    const n = ligne.partie as NumeroPartie;
    if (n >= 1 && n <= 5) (r as Record<NumeroPartie, unknown>)[n] = lirePartie(n, ligne.reponses);
  }
  return r;
}
