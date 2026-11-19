import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isCode, isQueteId, MONDES, type CodeCapacite, type MondeId, type QueteId } from "@/lib/questionnaire/contenu";
import type { Chemin } from "./calcul";

export type ChoixEnregistre = {
  quete: string;
  contenu: string | null;
  pratique: string | null;
  capaciteContenu?: string | null;
  capacitePratique?: string | null;
};

export type CheminEnregistre = Chemin & {
  id: string;
  dateDebut: string;
  semaine: number;
  /** Clés « m1s1 », « m1s3 », « m2s1 »… */
  choix: Record<string, ChoixEnregistre>;
  /** L'étape ouverte dans chaque semaine : {"1": 3}. */
  progression: Record<string, number>;
};

/** Son chemin actif, ou null. */
export async function chargerChemin(supabase: SupabaseClient): Promise<CheminEnregistre | null> {
  const { data, error } = await supabase
    .from("paths")
    .select("*")
    .eq("actif", true)
    .maybeSingle();
  if (error) throw new Error(`Lecture du chemin impossible (${error.code})`);
  if (!data) return null;

  const quetes = (data.quetes as string[]).filter(isQueteId);
  const mondes = (data.mondes as string[]).filter((m): m is MondeId => (MONDES as readonly string[]).includes(m));
  if (quetes.length !== 3 || mondes.length !== 3) return null;

  const brut = (data.capacites ?? {}) as Record<string, unknown>;
  const capacites = {} as Record<QueteId, [CodeCapacite, CodeCapacite]>;
  for (const q of quetes) {
    const c = Array.isArray(brut[q]) ? (brut[q] as unknown[]).filter(isCode) : [];
    capacites[q] = [c[0], c[1]] as [CodeCapacite, CodeCapacite];
  }

  return {
    id: data.id,
    quetes: quetes as [QueteId, QueteId, QueteId],
    capacites,
    mondes: mondes as [MondeId, MondeId, MondeId],
    dateDebut: data.date_debut,
    semaine: data.semaine_en_cours,
    choix: (data.choix && typeof data.choix === "object" ? data.choix : {}) as Record<string, ChoixEnregistre>,
    progression: (data.progression && typeof data.progression === "object" ? data.progression : {}) as Record<string, number>,
  };
}
