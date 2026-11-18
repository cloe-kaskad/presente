import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheminEnregistre } from "@/lib/chemin/donnees";
import { cleDeTexte, tachesDeLaCarte } from "./ecriture";
import type { Synthese } from "./secours";

export type TextesCarte = Map<string, { texte: string; statut: string }>;

export async function chargerTextesCarte(supabase: SupabaseClient, pathId: string): Promise<TextesCarte> {
  const { data, error } = await supabase
    .from("generated_texts")
    .select("emplacement, cle, texte, statut")
    .eq("path_id", pathId);
  if (error) {
    console.error("[carte] lecture des textes impossible :", error.code);
    return new Map();
  }
  return new Map((data ?? []).map((t) => [cleDeTexte(t.emplacement, t.cle), { texte: t.texte, statut: t.statut }]));
}

/** Vrai si tous les textes de la carte existent pour ce chemin. */
export function carteEcrite(textes: TextesCarte, chemin: CheminEnregistre): boolean {
  return tachesDeLaCarte(chemin).every((t) => textes.has(cleDeTexte(t.emplacement, t.cle)));
}

export function lireSynthese(textes: TextesCarte): Synthese | null {
  const t = textes.get(cleDeTexte("carte_synthese", ""));
  if (!t) return null;
  try {
    const s = JSON.parse(t.texte) as Synthese;
    return s.ouverture ? s : null;
  } catch {
    return null;
  }
}

export function texte(textes: TextesCarte, emplacement: string, cle: string): string | null {
  return textes.get(cleDeTexte(emplacement, cle))?.texte ?? null;
}

/** Efface les textes d'un chemin : ils seront réécrits au prochain passage par « On trace ton chemin ». */
export async function effacerTextes(supabase: SupabaseClient, pathId: string) {
  const { error } = await supabase.from("generated_texts").delete().eq("path_id", pathId);
  if (error) console.error("[carte] effacement des textes impossible :", error.code);
}
