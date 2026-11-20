"use server";

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
  retour: z.enum(["parle", "moyen", "pas_maintenant", "pas_pour_moi"]).nullable().optional(),
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
  return { ok: true };
}
