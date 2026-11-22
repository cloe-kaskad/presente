"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enregistrerEntree } from "@/app/carnet/actions";
import { chargerChemin } from "@/lib/chemin/donnees";
import { codeMot, codeReponse } from "@/lib/buddy/etat";
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

/** Sa phrase (rangée dans son carnet), puis « Chercher ma buddy » : on ne montre personne tout de suite. */
export async function chercherMaBuddy(phrase: string): Promise<{ ok: boolean }> {
  const texte = phrase.trim().slice(0, 300);
  const { chemin } = await session();
  if (texte) {
    const r = await enregistrerEntree({ semaine: chemin.semaine, type: "carnet", code: "buddy:presentation", question: "Ce qui m'amène ici, en une phrase", reponse: texte });
    if (!r.ok) return { ok: false };
  }
  const r = await maj((p) => ({ ...p, buddy: 3, buddy_recherche_le: Math.floor(Date.now() / 1000), buddy_montre: 3, buddy_test: 0 }));
  if (r.ok) await noter(r.supabase, "buddy_recherche_lancee", { semaine: r.chemin.semaine, pathId: r.chemin.id, unique: true });
  return { ok: r.ok };
}

/** « La rencontrer » : la rencontre a lieu, l'échange commence. */
export async function rencontrer(): Promise<void> {
  const r = await maj((p) => (p.buddy === 3 ? { ...p, buddy: 1, buddy_le: Math.floor(Date.now() / 1000), buddy_avance: 0 } : p));
  if (r.ok) {
    await noter(r.supabase, "buddy_rencontree", { semaine: r.chemin.semaine, pathId: r.chemin.id, unique: true });
    await noter(r.supabase, "buddy_acceptee", { semaine: r.chemin.semaine, pathId: r.chemin.id, unique: true });
  }
  redirect("/buddy");
}

/** Sa réponse à la question de la semaine (rangée dans son carnet). */
export async function repondreQuestion(numero: number, question: string, reponse: string): Promise<{ ok: boolean }> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 12) return { ok: false };
  const texte = reponse.trim().slice(0, 2000);
  if (!texte) return { ok: false };
  const { chemin } = await session();
  const r = await enregistrerEntree({ semaine: chemin.semaine, type: "carnet", code: codeReponse(chemin.progression, numero), question: question.slice(0, 500), reponse: texte });
  revalidatePath("/buddy");
  return r;
}

/** « Arrêter l'échange », sans justification. */
export async function arreterEchange(): Promise<void> {
  await maj((p) => ({ ...p, buddy: 2 }));
}

/** Panneau de test : « Recommencer la buddy depuis le début ». La proposition revient tout de suite. */
export async function proposerBuddyTest(): Promise<void> {
  const { user } = await session();
  if (!estEquipe(user.email)) return;
  await maj((p) => {
    const reste = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("buddy")));
    // Un nouvel échange : ses réponses repartent d'une page blanche (les anciennes restent dans son carnet).
    return { ...reste, buddy_test: Math.floor(Date.now() / 1000), buddy_echange: (p.buddy_echange ?? 0) + 1 };
  });
}

/** Panneau de test : « Trouver ma buddy maintenant », sans attendre le lendemain. */
export async function trouverMaBuddyTest(): Promise<void> {
  const { user } = await session();
  if (!estEquipe(user.email)) return;
  await maj((p) => (p.buddy === 3 ? { ...p, buddy_trouvee: Math.floor(Date.now() / 1000) } : p));
}

/** « Un mot pour elle » : une seule ligne (140 caractères au plus), une fois par semaine. Pas de réponse à la réponse. */
export async function laisserUnMot(numero: number, mot: string): Promise<{ ok: boolean }> {
  if (!Number.isInteger(numero) || numero < 2 || numero > 12) return { ok: false };
  const texte = mot.trim().replace(/\s+/g, " ").slice(0, 140);
  if (!texte) return { ok: false };
  const { chemin } = await session();
  const r = await enregistrerEntree({ semaine: chemin.semaine, type: "carnet", code: codeMot(chemin.progression, numero), question: "Un mot pour elle", reponse: texte });
  revalidatePath("/buddy");
  return r;
}

/** Le point de fin de mois : « Oui, on continue » ou « On s'arrête là ». Chacune répond de son côté (en test, Inès dit oui). */
export async function continuerLeMois(mois: 1 | 2, oui: boolean): Promise<void> {
  if (mois !== 1 && mois !== 2) return;
  await maj((p) => (oui ? { ...p, [`buddy_suite_m${mois}`]: 1 } : { ...p, [`buddy_suite_m${mois}`]: 0, buddy: 2 }));
}

/** Après un arrêt : demander une nouvelle buddy. Un nouvel échange, qui repart d'une page blanche. */
export async function demanderNouvelleBuddy(): Promise<void> {
  await maj((p) => {
    const garde = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("buddy") || k === "buddy_echange"));
    return { ...garde, buddy: 3, buddy_recherche_le: Math.floor(Date.now() / 1000), buddy_echange: (p.buddy_echange ?? 0) + 1, buddy_montre: 3 };
  });
}

/**
 * La fin du chemin à deux : « Envie de garder le lien ? ». En test, aucun contact n'est enregistré : Inès n'existe pas.
 * (Vraie version : le contact tapé s'affiche une fois chez l'autre si les deux disent oui, et n'est pas gardé plus de trente jours.)
 */
export async function garderLeLien(oui: boolean): Promise<void> {
  await maj((p) => ({ ...p, buddy_fin: oui ? 1 : 2 }));
}

/** Panneau de test : « Aller à la fin du chemin à deux ». */
export async function allerALaFinTest(): Promise<void> {
  const { user } = await session();
  if (!estEquipe(user.email)) return;
  await maj((p) => ({
    ...p,
    buddy: 1,
    buddy_le: p.buddy_le ?? Math.floor(Date.now() / 1000),
    buddy_avance: 11,
    buddy_suite_m1: 1,
    buddy_suite_m2: 1,
    buddy_fin_test: Math.floor(Date.now() / 1000),
  }));
}

/** La carte « comme si » du cercle de parole : « Je veux en être » note seulement l'intérêt. */
export async function interesseeParLeCercle(): Promise<void> {
  const r = await maj((p) => ({ ...p, cercle: Math.floor(Date.now() / 1000) }));
  await noter(r.supabase, "cercle_interet", { semaine: r.chemin.semaine, pathId: r.chemin.id, unique: true });
}
