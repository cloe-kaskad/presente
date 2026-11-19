import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ecrireTexte } from "@/lib/moteur/ecrire";
import { lundiDe, plusJours } from "./citations";
import type { JourNote } from "./donnees";

/**
 * « Ta semaine, relue » : une fois par semaine, au premier passage après la fin de la semaine,
 * s'il y a au moins trois entrées. En cas d'échec, rien n'est affiché (pas de texte générique).
 */
export async function resumeDeLaSemaine(
  supabase: SupabaseClient,
  userId: string,
  humeurs: JourNote[],
  aujourdhui: string,
  sujetsAEviter: string | null,
): Promise<{ texte: string | null; detresse: boolean }> {
  const lundi = plusJours(lundiDe(aujourdhui), -7); // la semaine passée, terminée
  const { data: existants } = await supabase
    .from("generated_texts")
    .select("cle, texte, statut")
    .eq("emplacement", "journal_semaine")
    .order("cle", { ascending: false })
    .limit(5);

  const dejaFait = (existants ?? []).some((e) => e.cle === lundi);
  const semaine = humeurs.filter((h) => h.jour >= lundi && h.jour < plusJours(lundi, 7)).sort((a, b) => (a.jour < b.jour ? -1 : 1));

  if (!dejaFait && semaine.length >= 3) {
    const r = await ecrireTexte({
      emplacement: "journal_semaine",
      entree: { journal: semaine.map((h) => ({ jour: h.jour, humeur: h.humeur, phrase: h.note || null })) },
      sources: semaine.flatMap((h) => [h.humeur, h.note]).filter(Boolean),
      sujetsAEviter,
    });
    if (r.statut === "detresse") return { texte: null, detresse: true };
    const ligne = {
      user_id: userId,
      emplacement: "journal_semaine",
      cle: lundi,
      texte: r.statut === "ok" ? r.texte : "",
      statut: r.statut,
      empreinte_sources: r.statut === "secours" ? r.raison : null,
    };
    const { error } = await supabase.from("generated_texts").insert(ligne);
    if (error && error.code !== "23505") console.error("[journal] résumé non enregistré :", error.code);
    if (r.statut === "ok") return { texte: r.texte, detresse: false };
  }

  const dernier = (existants ?? []).find((e) => e.statut === "ok" && e.texte);
  return { texte: dernier?.texte ?? null, detresse: false };
}
