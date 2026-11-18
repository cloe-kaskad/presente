"use server";

import { redirect } from "next/navigation";
import { calculerChemin } from "@/lib/chemin/calcul";
import { chargerChemin } from "@/lib/chemin/donnees";
import { dependancesIA } from "@/lib/chemin/lecture-ia";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { SCHEMAS, type NumeroPartie, type Partie5 } from "@/lib/questionnaire/reponses";
import { createClient } from "@/lib/supabase/server";

export type ResultatEnregistrement = { ok: true } | { ok: false; erreur: string };

const ETAPE_RE = /^[a-z0-9:_]{1,40}$/;

async function utilisatrice() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

/**
 * Sauvegarde automatique : une partie entière, remplacée à chaque fois.
 * Le contenu des réponses n'apparaît jamais dans les logs.
 */
export async function enregistrerPartie(
  partie: NumeroPartie,
  donnees: unknown,
  etape?: string,
): Promise<ResultatEnregistrement> {
  if (!(partie in SCHEMAS)) return { ok: false, erreur: "partie inconnue" };
  const lu = SCHEMAS[partie].safeParse(donnees);
  if (!lu.success) return { ok: false, erreur: "réponse invalide" };

  const { supabase, user } = await utilisatrice();

  const { error } = await supabase.from("questionnaire_responses").upsert(
    { user_id: user.id, passage: 1, partie, reponses: lu.data },
    { onConflict: "user_id,passage,partie" },
  );
  if (error) {
    console.error("[questionnaire] sauvegarde impossible :", error.code);
    return { ok: false, erreur: "sauvegarde impossible" };
  }

  const profil: Record<string, unknown> = {};
  if (etape && ETAPE_RE.test(etape)) profil.questionnaire_etape = etape;
  if (partie === 5) {
    const p = lu.data as Partie5;
    Object.assign(profil, {
      prenom: p.prenom?.trim() || null,
      age: p.age ?? null,
      code_postal: p.codePostal?.trim() || null,
      temps_par_semaine: p.temps ?? null,
      formats_preferes: p.formats ?? [],
      sujets_a_eviter: p.sujets?.trim() || null,
    });
  }
  if (Object.keys(profil).length) {
    const { error: e2 } = await supabase.from("profiles").update(profil).eq("id", user.id);
    if (e2) console.error("[questionnaire] profil non mis à jour :", e2.code);
  }
  return { ok: true };
}

export async function enregistrerEtape(etape: string): Promise<void> {
  if (!ETAPE_RE.test(etape)) return;
  const { supabase, user } = await utilisatrice();
  await supabase.from("profiles").update({ questionnaire_etape: etape }).eq("id", user.id);
}

/** Fin du questionnaire : on trace le chemin, puis direction la carte. */
export async function tracerMonChemin(): Promise<ResultatEnregistrement> {
  const { supabase, user } = await utilisatrice();

  const existant = await chargerChemin(supabase);
  if (!existant) {
    const reponses = await chargerReponses(supabase, 1);
    const chemin = await calculerChemin(
      { positions: reponses[2].quetes, appelle: reponses[2].appelle, zoom: reponses[3].zoom },
      dependancesIA(reponses),
    );

    const { error } = await supabase.from("paths").insert({
      user_id: user.id,
      quetes: chemin.quetes,
      capacites: chemin.capacites,
      mondes: chemin.mondes,
    });
    if (error) {
      console.error("[chemin] création impossible :", error.code);
      return { ok: false, erreur: "Ton chemin n'a pas pu être tracé. Réessaie dans un instant." };
    }
  }

  await supabase
    .from("profiles")
    .update({ questionnaire_termine_le: new Date().toISOString(), questionnaire_etape: "fin" })
    .eq("id", user.id);

  redirect("/carte/trace");
}
