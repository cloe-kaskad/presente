"use server";

import { TYPES_DEPUIS_LE_NAVIGATEUR, type TypeEvenement } from "@/lib/mesure/types";
import { noter } from "@/lib/mesure/noter";
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

/** « J'ai terminé » : la semaine est faite. La suivante s'ouvrira à sa date. */
export async function terminer(n: number, etapes: number): Promise<void> {
  if (!Number.isInteger(n) || n < 1 || n > 12) redirect("/chemin");
  const { supabase, chemin } = await session();
  const maj: Record<string, unknown> = {
    progression: { ...chemin.progression, [String(n)]: Math.max(etapes, chemin.progression[String(n)] ?? 0) },
  };
  // La semaine suivante ne s'ouvre plus ici : elle arrive 7 jours après le début de celle-ci (V0.9).
  const { error } = await supabase.from("paths").update(maj).eq("id", chemin.id);
  if (error) console.error("[semaine] fin de semaine non enregistrée :", error.code);
  else {
    await noter(supabase, "semaine_terminee", { semaine: n, pathId: chemin.id, unique: true });
    if (n % 4 === 0) await noter(supabase, "palier_fait", { semaine: n, pathId: chemin.id, unique: true });
  }
  revalidatePath("/chemin");
  redirect("/chemin");
}

// ---------------------------------------------------------------------------
// L'exercice, sur sa propre page
// ---------------------------------------------------------------------------

async function majProgression(
  n: number,
  patch: (p: Record<string, number>, semaine: number) => Record<string, number>,
  avancerSemaine = false,
  evenement?: TypeEvenement[],
) {
  if (!Number.isInteger(n) || n < 1 || n > 12) return { ok: false };
  const { supabase, chemin } = await session();
  if (n > chemin.semaine) return { ok: false };
  const maj: Record<string, unknown> = { progression: patch({ ...chemin.progression }, chemin.semaine) };
  if (avancerSemaine && n === chemin.semaine && n < 12) maj.semaine_en_cours = n + 1;
  const { error } = await supabase.from("paths").update(maj).eq("id", chemin.id);
  if (error) console.error("[exercice] progression non enregistrée :", error.code);
  else if (evenement) for (const t of evenement) await noter(supabase, t, { semaine: n, pathId: chemin.id, unique: true });
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
  const r = await majProgression(n, (p) => ({ ...p, [String(n)]: Math.max(3, p[String(n)] ?? 0) }), false, ["exercice_cree"]);
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
  return majProgression(n, (p) => ({ ...p, [String(n)]: Math.max(4, p[String(n)] ?? 0), [`ex${n}`]: 2, [`exfin${n}`]: Math.floor(Date.now() / 1000) }), false, ["exercice_termine", "semaine_terminee"]);
}

/**
 * « J'ai écouté » (brief V0.9) : la date est rangée dans la progression, sous « ecoute{n} » (secondes).
 * 0 = annulé. Sans clé : déduit du carnet (voir lib/semaines/ecoute.ts).
 */
export async function marquerEcoute(n: number, fait: boolean): Promise<{ ok: boolean; le: number }> {
  const le = fait ? Math.floor(Date.now() / 1000) : 0;
  const r = await majProgression(n, (p) => ({ ...p, [`ecoute${n}`]: le, ...(fait ? { [String(n)]: Math.max(2, p[String(n)] ?? 0) } : {}) }), false, fait ? ["contenu_ecoute"] : []);
  return { ok: r.ok, le };
}

/** « C'est lu » sur « Tirer le fil » : la date est rangée dans la progression, sous « fil{n} » (secondes). */
export async function marquerFilLu(n: number): Promise<{ ok: boolean }> {
  return majProgression(n, (p) => ({ ...p, [`fil${n}`]: Math.floor(Date.now() / 1000) }), false, ["fil_lu"]);
}

/** Les clics que seul le navigateur voit (ouvrir le contenu, l'article, la surprise, l'audio). Jamais de texte. */
export async function noterDepuisLeNavigateur(type: string, semaine?: number, cle?: string): Promise<void> {
  if (!(TYPES_DEPUIS_LE_NAVIGATEUR as readonly string[]).includes(type)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await noter(supabase, type as TypeEvenement, { semaine: semaine ?? null, cle: cle ?? null, unique: type === "contenu_ouvert" || type === "surprise_vue" });
}
