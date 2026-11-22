import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isCode, isQueteId, MONDES, type CodeCapacite, type MondeId, type QueteId } from "@/lib/questionnaire/contenu";
import { cleDebut, semaineOuverte } from "@/lib/semaines/calendrier";
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

/**
 * Vrai une fois qu'elle a ouvert son espace (après « Commencer mon chemin »).
 * La carte devient alors une page de son espace comme les autres : la barre du haut, sans l'offre.
 */
export function espaceOuvert(chemin: CheminEnregistre): boolean {
  return chemin.progression.espace === 1 || chemin.semaine > 1 || Object.values(chemin.progression).some((v) => v > 0);
}

/** Note que son espace est ouvert (une seule fois). */
export async function ouvrirEspace(supabase: SupabaseClient, chemin: CheminEnregistre): Promise<void> {
  if (chemin.progression.espace === 1) return;
  const progression = { ...chemin.progression, espace: 1 };
  const { error } = await supabase.from("paths").update({ progression }).eq("id", chemin.id);
  if (error) console.error("[chemin] ouverture de l'espace non enregistrée :", error.code);
  else chemin.progression = progression;
}

/**
 * Le calendrier (V0.9) : ouvre la semaine suivante le jour venu (7 jours après le début de la précédente),
 * que la précédente soit finie ou non. Met « chemin.semaine » à jour.
 */
export async function suivreLeCalendrier(supabase: SupabaseClient, chemin: CheminEnregistre): Promise<void> {
  const n = semaineOuverte({ semaine: chemin.semaine, progression: chemin.progression, dateDebut: chemin.dateDebut });
  if (n <= chemin.semaine) return;
  const { error } = await supabase.from("paths").update({ semaine_en_cours: n }).eq("id", chemin.id);
  if (error) console.error("[chemin] ouverture de la semaine suivante non enregistrée :", error.code);
  else chemin.semaine = n;
}

/** Le jour où elle ouvre une semaine pour la première fois : le point de départ de la suivante. */
export async function noterDebut(supabase: SupabaseClient, chemin: CheminEnregistre, n: number): Promise<void> {
  if (chemin.progression[cleDebut(n)] || (n === 1 && chemin.dateDebut)) return;
  const progression = { ...chemin.progression, [cleDebut(n)]: Math.floor(Date.now() / 1000) };
  const { error } = await supabase.from("paths").update({ progression }).eq("id", chemin.id);
  if (error) console.error("[chemin] début de semaine non enregistré :", error.code);
  else chemin.progression = progression;
}
