import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jourAParis } from "./citations";
import { nettoyerMots, normaliserMot } from "./mots";

/** Un jour noté : une des dix humeurs, ou un mot à elle (« + un mot »). */
export type JourNote = { jour: string; humeur: string; note: string };

/**
 * Ses humeurs des derniers jours, une par jour (la plus récente du jour).
 * Marche avant et après la migration V0.5 (colonnes « jour » et « note »).
 */
export async function chargerHumeurs(supabase: SupabaseClient, depuis: string): Promise<JourNote[]> {
  const avec = await supabase
    .from("moods")
    .select("jour, humeur, note, created_at")
    .gte("jour", depuis)
    .order("created_at", { ascending: false });
  let lignes: { jour: string; humeur: string; note: string | null }[];
  if (avec.error) {
    const sans = await supabase
      .from("moods")
      .select("humeur, created_at")
      .gte("created_at", `${depuis}T00:00:00Z`)
      .order("created_at", { ascending: false });
    lignes = (sans.data ?? []).map((m) => ({ jour: jourAParis(new Date(m.created_at)), humeur: m.humeur, note: null }));
  } else {
    lignes = (avec.data ?? []).map((m) => ({ jour: String(m.jour).slice(0, 10), humeur: m.humeur, note: m.note }));
  }
  const parJour = new Map<string, JourNote>();
  for (const l of lignes) {
    const humeur = typeof l.humeur === "string" ? normaliserMot(l.humeur) : "";
    if (!parJour.has(l.jour) && humeur) parJour.set(l.jour, { jour: l.jour, humeur, note: l.note ?? "" });
  }
  return [...parJour.values()].sort((a, b) => (a.jour < b.jour ? 1 : -1));
}

/** Ses mots d'humeur à elle (« + un mot »). Avant la migration V0.12 (colonne absente) : aucun. */
export async function chargerMesMots(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("profiles").select("mots_humeur").maybeSingle();
  if (error) return [];
  return nettoyerMots(data?.mots_humeur);
}
