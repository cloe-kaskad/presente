import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Emplacement } from "@/lib/moteur/regles";
import { ecrireTexte } from "@/lib/moteur/ecrire";

/**
 * Les textes d'une semaine, écrits par le moteur au moment où elle l'ouvre et gardés dans generated_texts
 * (clé « s3 », « s3:intro »…). Réécrits seulement si ce qu'elle a écrit a changé (empreinte des sources),
 * ou si c'était un texte de secours (retenté à la visite suivante).
 */

export type TexteSemaine = { texte: string; secours: boolean } | { detresse: true };

export async function texteDeSemaine(
  supabase: SupabaseClient,
  options: {
    userId: string;
    pathId: string;
    cle: string;
    emplacement: Emplacement;
    entree: Record<string, unknown>;
    sources: string[];
    sujetsAEviter: string | null;
    secours: string;
  },
): Promise<TexteSemaine> {
  const empreinte = createHash("sha256")
    .update(JSON.stringify(options.entree))
    .digest("hex")
    .slice(0, 32);

  const { data: existant } = await supabase
    .from("generated_texts")
    .select("id, texte, statut, empreinte_sources")
    .eq("path_id", options.pathId)
    .eq("emplacement", options.emplacement)
    .eq("cle", options.cle)
    .maybeSingle();

  // Déjà écrit pour ces mêmes réponses : on le garde.
  if (existant?.statut === "ok" && existant.empreinte_sources === empreinte) return { texte: existant.texte, secours: false };

  const r = await ecrireTexte({
    emplacement: options.emplacement,
    entree: options.entree,
    sources: options.sources,
    sujetsAEviter: options.sujetsAEviter,
  });
  if (r.statut === "detresse") {
    await supabase.from("profiles").update({ detresse_le: new Date().toISOString() }).eq("id", options.userId);
    return { detresse: true };
  }

  const ligne = {
    user_id: options.userId,
    path_id: options.pathId,
    emplacement: options.emplacement,
    cle: options.cle,
    texte: r.statut === "ok" ? r.texte : options.secours,
    statut: r.statut,
    // Pour un texte écrit : l'empreinte de ses réponses. Pour un secours : la raison (jamais ses mots).
    empreinte_sources: r.statut === "ok" ? empreinte : r.raison,
  };
  const { error } = existant
    ? await supabase.from("generated_texts").update(ligne).eq("id", existant.id)
    : await supabase.from("generated_texts").insert(ligne);
  if (error && error.code !== "23505") console.error(`[semaine:${options.emplacement}] non enregistré :`, error.code);

  return r.statut === "ok" ? { texte: r.texte, secours: false } : { texte: options.secours, secours: true };
}
