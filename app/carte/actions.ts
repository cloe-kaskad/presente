"use server";

import { redirect } from "next/navigation";
import { calculerChemin, ordonner, troisQuetes, capacitesDe } from "@/lib/chemin/calcul";
import { chargerChemin } from "@/lib/chemin/donnees";
import { dependancesIA } from "@/lib/chemin/lecture-ia";
import { carteEcrite, chargerTextesCarte, effacerTextes } from "@/lib/moteur/carte";
import { ecrireLaCarte } from "@/lib/moteur/ecriture";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { Partie2 } from "@/lib/questionnaire/reponses";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

export type ResultatCarte = { ok: true } | { detresse: true } | { ok: false };

/**
 * Pendant l'écran « On trace ton chemin » : le moteur écrit les textes de la carte qui manquent.
 * Ses réponses ne sont jamais écrites dans les logs.
 */
export async function ecrireMaCarte(): Promise<ResultatCarte> {
  const { supabase, user } = await session();
  const chemin = await chargerChemin(supabase);
  if (!chemin) return { ok: false };

  const [{ data: profil }, reponses, textes] = await Promise.all([
    supabase.from("profiles").select("sujets_a_eviter, detresse_le").maybeSingle(),
    chargerReponses(supabase, 1),
    chargerTextesCarte(supabase, chemin.id),
  ]);
  if (profil?.detresse_le) return { detresse: true };
  // Les textes de secours ne comptent pas comme écrits : on retente de les écrire pour de vrai.
  const valides = new Set([...textes].filter(([, t]) => t.statut === "ok").map(([cle]) => cle));
  const aReecrire = [...textes].filter(([, t]) => t.statut !== "ok").map(([cle]) => cle);
  if (carteEcrite(textes, chemin) && !aReecrire.length) return { ok: true };

  const r = await ecrireLaCarte({ chemin, reponses, sujetsAEviter: profil?.sujets_a_eviter ?? null }, valides);

  if (r.detresse) {
    await supabase.from("profiles").update({ detresse_le: new Date().toISOString() }).eq("id", user.id);
    return { detresse: true };
  }

  if (aReecrire.length) {
    // On retire les anciens textes de secours avant d'enregistrer les nouveaux.
    for (const cle of aReecrire) {
      const [emplacement, ...reste] = cle.split(":");
      await supabase.from("generated_texts").delete().eq("path_id", chemin.id).eq("emplacement", emplacement).eq("cle", reste.join(":"));
    }
  }

  if (r.textes.length) {
    // La raison d'un texte de secours va dans empreinte_sources : elle ne contient jamais ses mots.
    const lignes = r.textes.map(({ raison, ...t }) => ({
      user_id: user.id,
      path_id: chemin.id,
      ...t,
      empreinte_sources: raison ?? null,
    }));
    const { error } = await supabase.from("generated_texts").insert(lignes);
    // 23505 : un autre onglet les a écrits entre-temps. Rien de grave.
    if (error && error.code !== "23505") {
      console.error("[carte] textes non enregistrés :", error.code);
      return { ok: false };
    }
  }
  // Si la synthèse n'a pas pu être écrite, on le dit : la carte s'affiche quand même, sans boucler.
  const synthese = r.textes.find((t) => t.emplacement === "carte_synthese");
  return synthese?.statut === "secours" ? { ok: false } : { ok: true };
}

/** Pour la démo : recalcule le chemin à partir des réponses enregistrées, et réécrit la carte. */
export async function recalculerMonChemin(): Promise<void> {
  const { supabase, user } = await session();
  const chemin = await chargerChemin(supabase);
  const reponses = await chargerReponses(supabase, 1);
  const nouveau = await calculerChemin(
    { positions: reponses[2].quetes, appelle: reponses[2].appelle, zoom: reponses[3].zoom },
    dependancesIA(reponses),
  );

  if (chemin) {
    const { error } = await supabase
      .from("paths")
      .update({ quetes: nouveau.quetes, capacites: nouveau.capacites, mondes: nouveau.mondes, choix: {} })
      .eq("id", chemin.id);
    if (error) console.error("[chemin] recalcul impossible :", error.code);
    await effacerTextes(supabase, chemin.id);
  } else {
    await supabase
      .from("paths")
      .insert({ user_id: user.id, quetes: nouveau.quetes, capacites: nouveau.capacites, mondes: nouveau.mondes });
  }
  await supabase.from("profiles").update({ detresse_le: null }).eq("id", user.id);
  redirect("/carte/trace");
}

/**
 * « Garder ce chemin » sur l'écran Échanger : on enregistre ses curseurs.
 * Si les trois quêtes ou leur ordre changent, le chemin est recomposé et la carte réécrite.
 */
export async function garderCeChemin(positions: unknown): Promise<void> {
  const lu = Partie2.shape.quetes.safeParse(positions);
  if (!lu.success) redirect("/carte/echanger");

  const { supabase, user } = await session();
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  const reponses = await chargerReponses(supabase, 1);

  const partie2 = { ...reponses[2], quetes: lu.data };
  const { error } = await supabase
    .from("questionnaire_responses")
    .upsert({ user_id: user.id, passage: 1, partie: 2, reponses: partie2 }, { onConflict: "user_id,passage,partie" });
  if (error) {
    console.error("[echanger] curseurs non enregistrés :", error.code);
    redirect("/carte/echanger");
  }

  const deps = dependancesIA({ ...reponses, 2: partie2 });
  const quetes = ordonner(await troisQuetes(partie2.quetes, partie2.appelle, deps.departage), partie2.quetes);
  const inchange = quetes.every((q, i) => q === chemin.quetes[i]);
  if (inchange) redirect("/carte");

  const capacites = Object.fromEntries(
    await Promise.all(
      quetes.map(async (q) => [q, chemin.capacites[q] ?? (await capacitesDe(q, reponses[3].zoom, deps.choisirCapacites))] as const),
    ),
  );
  const { error: e2 } = await supabase.from("paths").update({ quetes, capacites, choix: {} }).eq("id", chemin.id);
  if (e2) {
    console.error("[echanger] chemin non recomposé :", e2.code);
    redirect("/carte");
  }
  await effacerTextes(supabase, chemin.id);
  redirect("/carte/trace");
}
