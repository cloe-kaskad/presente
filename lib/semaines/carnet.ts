import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { codeLu, departDe } from "./depart";

export type TypeEntree = "avant" | "carnet" | "mini_questionnaire" | "exercice" | "acte" | "palier";
export type Retour = "parle" | "pas_mal" | "moyen" | "pas_maintenant" | "pas_pour_moi";

export type Entree = {
  semaine: number;
  type: TypeEntree;
  code: string;
  question: string;
  reponse: string;
  retour: Retour | null;
  modifiee: string;
  creee: string;
};

/**
 * Toutes ses entrées de carnet. La RLS garantit qu'on ne lit que les siennes.
 * Après « Revenir à la première semaine », les réponses d'avant sont mises de côté (voir depart.ts).
 */
export async function chargerCarnet(supabase: SupabaseClient): Promise<Entree[]> {
  const [{ data, error }, { data: chemin }] = await Promise.all([
    supabase
      .from("carnet_entries")
      .select("semaine, type, question_code, question, reponse, retour, created_at, updated_at")
      .order("semaine", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase.from("paths").select("progression").eq("actif", true).maybeSingle(),
  ]);
  const depart = departDe(chemin?.progression as Record<string, number> | undefined);
  if (error) {
    console.error("[carnet] lecture impossible :", error.code);
    return [];
  }
  const lignes = [...(data ?? [])].sort((a, b) => b.semaine - a.semaine || (a.created_at < b.created_at ? -1 : 1));
  return lignes.flatMap((e) => {
    const code = codeLu(e.question_code ?? "", depart);
    return code === null ? [] : [{
    semaine: e.semaine,
    type: e.type,
    code,
    question: e.question,
    reponse: e.reponse ?? "",
    retour: e.retour,
    modifiee: e.updated_at,
    creee: e.created_at,
  }];
  });
}

/** Les entrées d'une semaine, par code de question. */
export function parCode(entrees: Entree[], semaine?: number): Map<string, Entree> {
  return new Map(entrees.filter((e) => semaine === undefined || e.semaine === semaine).map((e) => [e.code, e]));
}
