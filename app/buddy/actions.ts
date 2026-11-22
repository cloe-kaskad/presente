"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enregistrerEntree } from "@/app/carnet/actions";
import { chargerChemin } from "@/lib/chemin/donnees";
import { estEquipe } from "@/lib/equipe";
import { noter } from "@/lib/mesure/noter";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  return { supabase, user, chemin };
}

async function maj(patch: (p: Record<string, number>, semaine: number) => Record<string, number>) {
  const { supabase, chemin } = await session();
  const progression = patch({ ...chemin.progression }, chemin.semaine);
  const { error } = await supabase.from("paths").update({ progression }).eq("id", chemin.id);
  if (error) console.error("[buddy] non enregistré :", error.code);
  revalidatePath("/chemin");
  revalidatePath("/buddy");
  return { ok: !error, supabase, chemin };
}

/** « Oui, présentez-moi quelqu'un » ou « Pas maintenant ». */
export async function repondreProposition(oui: boolean): Promise<void> {
  if (oui) {
    redirect("/buddy");
  }
  // La semaine du refus : la proposition revient une seule fois, au début du mois 2.
  const r = await maj((p, semaine) => ({ ...p, buddy_refus: (p.buddy_refus ?? 0) + 1, buddy_test: 0, buddy_refus_semaine: semaine }));
  await noter(r.supabase, "buddy_refusee", { semaine: r.chemin.semaine, pathId: r.chemin.id });
}

/** Elle se présente : sa phrase (rangée dans son carnet) et ce qu'elle accepte de montrer. */
export async function sePresenter(phrase: string, montrerPrenom: boolean, montrerQuete: boolean): Promise<{ ok: boolean }> {
  const texte = phrase.trim().slice(0, 300);
  const { chemin } = await session();
  if (texte) {
    const r = await enregistrerEntree({ semaine: chemin.semaine, type: "carnet", code: "buddy:presentation", question: "Ce qui m'amène ici, en une phrase", reponse: texte });
    if (!r.ok) return { ok: false };
  }
  const r = await maj((p) => ({ ...p, buddy: 1, buddy_le: Math.floor(Date.now() / 1000), buddy_montre: (montrerPrenom ? 1 : 0) + (montrerQuete ? 2 : 0) }));
  if (r.ok) await noter(r.supabase, "buddy_acceptee", { semaine: r.chemin.semaine, pathId: r.chemin.id, unique: true });
  return { ok: r.ok };
}

/** Sa réponse à la question de la semaine (rangée dans son carnet). */
export async function repondreQuestion(numero: number, question: string, reponse: string): Promise<{ ok: boolean }> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 12) return { ok: false };
  const texte = reponse.trim().slice(0, 2000);
  if (!texte) return { ok: false };
  const { chemin } = await session();
  const r = await enregistrerEntree({ semaine: chemin.semaine, type: "carnet", code: `buddy:q${numero}`, question: question.slice(0, 500), reponse: texte });
  revalidatePath("/buddy");
  return r;
}

/** « Arrêter l'échange », sans justification. */
export async function arreterEchange(): Promise<void> {
  await maj((p) => ({ ...p, buddy: 2 }));
}

/** Panneau de test (équipe seulement) : la proposition arrive tout de suite, et on peut tout rejouer. */
export async function proposerBuddyTest(): Promise<void> {
  const { user } = await session();
  if (!estEquipe(user.email)) return;
  await maj((p) => {
    const { buddy: _b, buddy_le: _l, buddy_refus: _r, buddy_refus_semaine: _s, buddy_montre: _m, ...reste } = p;
    return { ...reste, buddy_test: Math.floor(Date.now() / 1000) };
  });
}
