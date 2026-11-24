"use server";

import { noter } from "@/lib/mesure/noter";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { detecterDetresse } from "@/lib/moteur/ecriture";
import { jourAParis } from "@/lib/rituel/citations";
import { estEquipe } from "@/lib/equipe";
import { stadeReel } from "@/lib/semaines/calendrier";
import { estHumeur } from "@/lib/rituel/humeurs";
import { chargerMesMots } from "@/lib/rituel/donnees";
import { ajouterMot, normaliserMot, retirerMot, type Ajout } from "@/lib/rituel/mots";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

/**
 * L'humeur du jour, avec une phrase facultative. Une entrée par jour, modifiable dans la journée.
 * La phrase passe par la détection de détresse. Rien n'est écrit dans les logs.
 */
export async function noterHumeur(brut: string, note: string): Promise<{ ok: boolean; detresse?: boolean }> {
  const humeur = normaliserMot(brut);
  const phrase = note.trim().slice(0, 300);
  const { supabase, user } = await session();
  // Une des dix humeurs, ou un de ses mots à elle.
  if (!estHumeur(humeur) && !(await chargerMesMots(supabase)).includes(humeur)) return { ok: false };

  if (phrase && (await detecterDetresse([{ question: "Comment tu vas, aujourd'hui ? Pourquoi, en une phrase ?", reponse: phrase }]))) {
    await supabase.from("profiles").update({ detresse_le: new Date().toISOString() }).eq("id", user.id);
    return { ok: true, detresse: true };
  }

  const jour = jourAParis();
  const { error } = await supabase
    .from("moods")
    .upsert({ user_id: user.id, jour, humeur, note: phrase || null }, { onConflict: "user_id,jour" });
  if (error) {
    // Avant la migration V0.5 (pas de colonne « jour » ni « note ») : on garde au moins l'humeur.
    const { error: e2 } = await supabase.from("moods").insert({ user_id: user.id, humeur });
    if (e2) {
      console.error("[humeur] non enregistrée :", e2.code);
      return { ok: false };
    }
  }
  await noter(supabase, "humeur_notee", { unique: true, cle: jour });
  revalidatePath("/chemin");
  revalidatePath("/journal");
  return { ok: true };
}

/**
 * « Ouvrir la suite maintenant » (démo V0, comptes de la liste d'accès) : la semaine suivante s'ouvre
 * sans attendre sa date. Son début sera noté quand elle l'ouvrira.
 */
export async function ouvrirLaSuite(): Promise<void> {
  const { supabase, user } = await session();
  if (!estEquipe(user.email)) return; // panneau de test : l'équipe seulement
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  if (chemin.semaine < 12) {
    const { error } = await supabase
      .from("paths")
      // La question de la buddy avance aussi d'une semaine (brief V0.11).
      .update({
        semaine_en_cours: chemin.semaine + 1,
        ...(chemin.progression.buddy === 1 ? { progression: { ...chemin.progression, buddy_avance: (chemin.progression.buddy_avance ?? 0) + 1 } } : {}),
      })
      .eq("id", chemin.id);
    if (error) console.error("[chemin] semaine suivante impossible :", error.code);
  }
  revalidatePath("/chemin");
}

/** « Recevoir La Question Chérie » : on garde son choix. L'inscription réelle sera branchée plus tard. */
export async function choisirNewsletter(oui: boolean): Promise<{ ok: boolean }> {
  const { supabase, user } = await session();
  const { error } = await supabase.from("profiles").update({ newsletter: oui }).eq("id", user.id);
  if (error) console.error("[newsletter] choix non enregistré :", error.code);
  return { ok: !error };
}

/** Panneau de test (équipe seulement) : la surprise arrive tout de suite, sans attendre le dixième jour. */
export async function declencherSurprise(): Promise<void> {
  const { supabase, user } = await session();
  if (!estEquipe(user.email)) return;
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  // On la rend « pas encore ouverte » pour pouvoir rejouer la découverte.
  const { surprise_vue: _vue, ...reste } = chemin.progression;
  const { error } = await supabase
    .from("paths")
    .update({ progression: { ...reste, surprise: Math.floor(Date.now() / 1000) } })
    .eq("id", chemin.id);
  if (error) console.error("[test] surprise non déclenchée :", error.code);
  revalidatePath("/chemin");
}

/**
 * Panneau de test : « Revenir au stade réel ». Défait les raccourcis de test (semaines ouvertes en avance,
 * surprise et buddy déclenchées) pour retrouver où elle en serait vraiment. Ce qu'elle a écrit reste dans son carnet.
 */
export async function revenirAuStadeReel(): Promise<void> {
  const { supabase, user } = await session();
  if (!estEquipe(user.email)) return;
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  const r = stadeReel({ progression: chemin.progression, dateDebut: chemin.dateDebut });
  const { error } = await supabase.from("paths").update({ semaine_en_cours: r.semaine, progression: r.progression }).eq("id", chemin.id);
  if (error) console.error("[test] retour au stade réel impossible :", error.code);
  revalidatePath("/chemin");
}

/** Les mots tels qu'ils sont enregistrés. Avant la migration V0.12, la colonne n'existe pas : on le dit. */
async function enregistrerMots(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, mots: string[]): Promise<boolean> {
  const { error } = await supabase.from("profiles").update({ mots_humeur: mots }).eq("id", userId);
  if (error) console.error("[mots] non enregistrés :", error.code);
  return !error;
}

/** « + un mot » : le mot rejoint sa liste (sauf doublon) et sera choisi pour aujourd'hui. */
export async function ajouterMonMot(brut: string): Promise<Ajout> {
  const { supabase, user } = await session();
  const mots = await chargerMesMots(supabase);
  const r = ajouterMot(mots, String(brut ?? ""));
  if (r.ok && r.nouveau && !(await enregistrerMots(supabase, user.id, r.mots))) {
    return { ok: false, erreur: "Ce n'est pas enregistré. Réessaie dans un instant.", mots };
  }
  if (r.ok && r.nouveau) {
    revalidatePath("/chemin");
    revalidatePath("/journal");
  }
  return r;
}

/** La croix : le mot quitte sa liste. Les jours déjà notés avec ce mot ne changent pas. */
export async function retirerMonMot(mot: string): Promise<{ ok: boolean; mots: string[] }> {
  const { supabase, user } = await session();
  const mots = await chargerMesMots(supabase);
  const reste = retirerMot(mots, String(mot ?? ""));
  if (reste.length === mots.length) return { ok: true, mots };
  const ok = await enregistrerMots(supabase, user.id, reste);
  if (ok) {
    revalidatePath("/chemin");
    revalidatePath("/journal");
  }
  return { ok, mots: ok ? reste : mots };
}
