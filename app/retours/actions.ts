"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { chargerChemin } from "@/lib/chemin/donnees";
import { prenomAffiche } from "@/lib/chemin/textes";
import { estEquipe, estTesteuse } from "@/lib/equipe";
import { IMAGE_MAX, TYPES_RETOUR, UN_DE_SES_TEXTES, pageGenerale, texteCourt, type Repere } from "@/lib/retours/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const IMAGES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic" };
const nombre = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 100) / 100)) : null);

/**
 * « Un retour ? » : un retour d'une testeuse (ou de l'équipe), pointé sur la page. Jamais pour une cliente.
 * Rien n'est jamais écrit dans les logs. Sa semaine et son étape sont ajoutées ici, sans qu'elle ait rien à faire.
 */
export async function envoyerRetour(donnees: FormData): Promise<{ ok: boolean; erreur?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estTesteuse(user.email)) return { ok: false, erreur: "Réservé aux testeuses." };

  const texte = String(donnees.get("texte") ?? "").trim().slice(0, 4000);
  if (!texte) return { ok: false, erreur: "Écris quelques mots." };
  let repere: Partial<Repere> = {};
  let types: string[] = [];
  try {
    repere = JSON.parse(String(donnees.get("repere") ?? "{}"));
    types = JSON.parse(String(donnees.get("types") ?? "[]"));
  } catch {
    return { ok: false, erreur: "Envoi incomplet, réessaie." };
  }
  const permis = new Set<string>(TYPES_RETOUR.map((t) => t.id));
  types = Array.isArray(types) ? [...new Set(types.filter((t) => typeof t === "string" && permis.has(t)))] : [];
  const element = repere.elementTexte === UN_DE_SES_TEXTES ? UN_DE_SES_TEXTES : texteCourt(repere.elementTexte);
  const largeur = nombre(repere.ecranLargeur, 0, 10000);

  // Sa semaine et son étape, et son prénom.
  const [chemin, { data: profil }] = await Promise.all([chargerChemin(supabase).catch(() => null), supabase.from("profiles").select("prenom").maybeSingle()]);
  const semaine = chemin?.semaine ?? null;
  const etape = chemin && semaine ? `étape ${Math.max(1, (chemin.progression[String(semaine)] ?? 0) + 1)}` : null;

  // L'image, si elle a choisi d'en joindre une : déjà déposée dans l'espace privé (preparerImage), à son nom.
  const imageBrute = String(donnees.get("image") ?? "");
  const imagePath = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(png|jpg|webp|gif|heic)$`).test(imageBrute) ? imageBrute : null;

  // Enregistré par le serveur (la testeuse est vérifiée plus haut), à son nom ; elle ne peut pas relire ses retours.
  const { error } = await createAdminClient().from("retours").insert({
    user_id: user.id,
    prenom: prenomAffiche(profil?.prenom) ?? null,
    page_url: pageGenerale(String(repere.pageUrl ?? "/")),
    page_titre: texteCourt(repere.pageTitre)?.slice(0, 200) ?? null,
    x_pct: repere.touteLaPage ? null : nombre(repere.xPct, 0, 100),
    y_pct: repere.touteLaPage ? null : nombre(repere.yPct, 0, 100),
    element_texte: repere.touteLaPage ? null : element,
    toute_la_page: Boolean(repere.touteLaPage),
    ecran_largeur: largeur,
    ecran_hauteur: nombre(repere.ecranHauteur, 0, 10000),
    appareil: largeur !== null ? (largeur < 768 ? "telephone" : "ordinateur") : null,
    semaine,
    etape,
    types,
    texte,
    image_path: imagePath,
  });
  if (error) {
    console.error("[retours] non enregistré :", error.code);
    return { ok: false, erreur: "Ce n'est pas enregistré. Réessaie dans un instant." };
  }
  revalidatePath("/equipe/retours");
  return { ok: true };
}

/**
 * L'image jointe part directement du navigateur vers l'espace privé (les serveurs refusent les envois de plus de
 * 4,5 Mo) : on lui donne ici une autorisation d'envoi à usage unique, à son nom, après avoir vérifié le type et la taille.
 */
export async function preparerImage(type: string, taille: number): Promise<{ ok: true; chemin: string; url: string } | { ok: false; erreur: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estTesteuse(user.email)) return { ok: false, erreur: "Réservé aux testeuses." };
  const ext = IMAGES[type];
  if (!ext) return { ok: false, erreur: "Cette image n'est pas acceptée (PNG, JPEG, WebP, GIF ou HEIC)." };
  if (!(taille > 0) || taille > IMAGE_MAX) return { ok: false, erreur: "L'image dépasse 5 Mo." };
  const chemin = `${user.id}/${randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient().storage.from("retours").createSignedUploadUrl(chemin);
  if (error || !data) {
    console.error("[retours] autorisation d'envoi impossible :", error?.message);
    return { ok: false, erreur: "L'image n'a pas pu être envoyée. Réessaie, ou envoie sans image." };
  }
  return { ok: true, chemin, url: data.signedUrl };
}

async function equipe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user && estEquipe(user.email));
}

/** Page de l'équipe : la case « Traité ». */
export async function marquerTraite(brut: number | string, traite: boolean): Promise<{ ok: boolean }> {
  const id = Number(brut);
  if (!(await equipe()) || !Number.isInteger(id)) return { ok: false };
  const { error } = await createAdminClient().from("retours").update({ traite }).eq("id", id);
  revalidatePath("/equipe/retours");
  return { ok: !error };
}

/** Page de l'équipe : le champ « Note ». */
export async function noterRetour(brut: number | string, note: string): Promise<{ ok: boolean }> {
  const id = Number(brut);
  if (!(await equipe()) || !Number.isInteger(id)) return { ok: false };
  const { error } = await createAdminClient()
    .from("retours")
    .update({ note: note.trim().slice(0, 2000) || null })
    .eq("id", id);
  revalidatePath("/equipe/retours");
  return { ok: !error };
}
