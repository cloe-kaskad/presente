"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  return { supabase, chemin };
}

/** L'étape suivante de la semaine s'ouvre. On ne revient jamais en arrière. */
export async function avancer(n: number, etape: number): Promise<{ ok: boolean }> {
  if (!Number.isInteger(n) || n < 1 || n > 12 || !Number.isInteger(etape) || etape < 0 || etape > 6) return { ok: false };
  const { supabase, chemin } = await session();
  if (n > chemin.semaine) return { ok: false };
  const actuelle = chemin.progression[String(n)] ?? 0;
  if (etape <= actuelle) return { ok: true };
  const { error } = await supabase
    .from("paths")
    .update({ progression: { ...chemin.progression, [String(n)]: etape } })
    .eq("id", chemin.id);
  if (error) console.error("[semaine] progression non enregistrée :", error.code);
  revalidatePath(`/semaine/${n}`);
  return { ok: !error };
}

/** « J'ai terminé » : la semaine est faite, la suivante s'ouvre. */
export async function terminer(n: number, etapes: number): Promise<void> {
  if (!Number.isInteger(n) || n < 1 || n > 12) redirect("/chemin");
  const { supabase, chemin } = await session();
  const maj: Record<string, unknown> = {
    progression: { ...chemin.progression, [String(n)]: Math.max(etapes, chemin.progression[String(n)] ?? 0) },
  };
  if (n === chemin.semaine && n < 12) maj.semaine_en_cours = n + 1;
  let { error } = await supabase.from("paths").update(maj).eq("id", chemin.id);
  // Avant la migration V0.4 (pas de colonne « progression ») : on avance au moins la semaine.
  if (error && maj.semaine_en_cours) ({ error } = await supabase.from("paths").update({ semaine_en_cours: maj.semaine_en_cours }).eq("id", chemin.id));
  if (error) console.error("[semaine] fin de semaine non enregistrée :", error.code);
  revalidatePath("/chemin");
  redirect("/chemin");
}

// ---------------------------------------------------------------------------
// L'exercice, sur sa propre page
// ---------------------------------------------------------------------------

async function majProgression(n: number, patch: (p: Record<string, number>, semaine: number) => Record<string, number>, avancerSemaine = false) {
  if (!Number.isInteger(n) || n < 1 || n > 12) return { ok: false };
  const { supabase, chemin } = await session();
  if (n > chemin.semaine) return { ok: false };
  const maj: Record<string, unknown> = { progression: patch({ ...chemin.progression }, chemin.semaine) };
  if (avancerSemaine && n === chemin.semaine && n < 12) maj.semaine_en_cours = n + 1;
  const { error } = await supabase.from("paths").update(maj).eq("id", chemin.id);
  if (error) console.error("[exercice] progression non enregistrée :", error.code);
  revalidatePath(`/semaine/${n}`);
  revalidatePath(`/semaine/${n}/exercice`);
  revalidatePath("/chemin");
  return { ok: !error };
}

/**
 * « Vers ton exercice » : l'exercice est créé (étape 3) et son introduction s'écrit maintenant,
 * pendant que l'écran « On écrit ton exercice » est affiché. La page de l'exercice s'ouvre ensuite.
 */
export async function preparerExercice(n: number): Promise<{ ok: boolean }> {
  const r = await majProgression(n, (p) => ({ ...p, [String(n)]: Math.max(3, p[String(n)] ?? 0) }));
  if (!r.ok) return r;
  const { contexteSemaine, queteDeLaSemaine, introDeLaPratique } = await import("./[n]/contexte");
  const ctx = await contexteSemaine(n);
  if (ctx.d !== 1 && ctx.d !== 3) return { ok: false };
  await introDeLaPratique(ctx, await queteDeLaSemaine(ctx));
  return { ok: true };
}

/** « Commencer » : l'exercice passe en cours. */
export async function commencerExercice(n: number): Promise<{ ok: boolean }> {
  return majProgression(n, (p) => ({ ...p, [String(n)]: Math.max(3, p[String(n)] ?? 0), [`ex${n}`]: Math.max(1, p[`ex${n}`] ?? 0) }));
}

/** « J'ai terminé » : l'exercice est terminé, et sa semaine aussi. On reste sur la page de l'exercice. */
export async function terminerExercice(n: number): Promise<{ ok: boolean }> {
  return majProgression(n, (p) => ({ ...p, [String(n)]: Math.max(4, p[String(n)] ?? 0), [`ex${n}`]: 2, [`exfin${n}`]: Math.floor(Date.now() / 1000) }), true);
}
