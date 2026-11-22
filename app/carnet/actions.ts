"use server";

import { noter } from "@/lib/mesure/noter";
import { redirect } from "next/navigation";
import { z } from "zod";
import { chargerChemin } from "@/lib/chemin/donnees";
import { createClient } from "@/lib/supabase/server";

const Entree = z.object({
  semaine: z.number().int().min(1).max(12),
  type: z.enum(["avant", "carnet", "mini_questionnaire", "exercice", "acte", "palier"]),
  code: z.string().regex(/^[a-z0-9:_-]{1,60}$/),
  question: z.string().min(1).max(500),
  reponse: z.string().max(5000).default(""),
  retour: z.enum(["parle", "pas_mal", "moyen", "pas_maintenant", "pas_pour_moi"]).nullable().optional(),
});

export type EntreeAEnregistrer = z.input<typeof Entree>;

/**
 * Sauvegarde automatique d'une réponse de carnet : une par question et par semaine, remplacée à chaque fois.
 * Le contenu n'apparaît jamais dans les logs.
 */
export async function enregistrerEntree(e: EntreeAEnregistrer): Promise<{ ok: boolean }> {
  const lu = Entree.safeParse(e);
  if (!lu.success) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin || lu.data.semaine > chemin.semaine) return { ok: false };

  const ligne: Record<string, unknown> = {
    user_id: user.id,
    path_id: chemin.id,
    semaine: lu.data.semaine,
    type: lu.data.type,
    question_code: lu.data.code,
    question: lu.data.question,
    reponse: lu.data.reponse,
  };
  if (lu.data.retour !== undefined) ligne.retour = lu.data.retour;

  const { error } = await supabase
    .from("carnet_entries")
    .upsert(ligne, { onConflict: "user_id,semaine,question_code" });
  if (error) {
    console.error("[carnet] sauvegarde impossible :", error.code);
    return { ok: false };
  }
  await noterEtape(supabase, lu.data, chemin.id);
  return { ok: true };
}

/** L'étape franchie, déduite du code de la question. Jamais le texte écrit. */
async function noterEtape(
  supabase: Awaited<ReturnType<typeof createClient>>,
  e: { semaine: number; code: string; reponse: string; retour?: string | null },
  pathId: string,
) {
  const base = { semaine: e.semaine, pathId };
  if (e.retour) return noter(supabase, "avis_donne", { ...base, cle: e.retour });
  if (!e.reponse.trim()) return;
  if (e.code.startsWith("qc:")) return noter(supabase, "question_cherie_repondue", { ...base, unique: true, cle: e.code.slice(3) });
  if (/^buddy:(e\d+)?q\d+$/.test(e.code)) return noter(supabase, "buddy_reponse", { ...base, unique: true, cle: e.code.slice(6) });
  if (e.code.startsWith("echo:")) return noter(supabase, "echo_repondu", { ...base, unique: true, cle: e.code.slice(5) });
  if (/^s\d+:carnet:/.test(e.code)) return noter(supabase, "carnet_ecrit", { ...base, unique: true });
  if (/^s\d+:exo:jour:/.test(e.code)) return noter(supabase, "exercice_jour_note", { ...base, unique: true, cle: e.code.split(":").pop() });
}
