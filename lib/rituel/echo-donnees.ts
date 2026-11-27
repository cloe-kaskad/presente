import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QUESTION_APPELLE, QUESTION_PAS_ENCORE, QUESTIONS_OUVERTES, QUETE, ZOOM, type QueteId } from "@/lib/questionnaire/contenu";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { jourAParis } from "./citations";
import type { Candidat } from "./echo";

/** Ses réponses datées : le carnet, et ses réponses ouvertes au questionnaire. */
export async function candidatsEcho(supabase: SupabaseClient, reponses: Reponses): Promise<Candidat[]> {
  const [{ data: entrees }, { data: parties }] = await Promise.all([
    supabase.from("carnet_entries").select("question_code, question, reponse, created_at"),
    supabase.from("questionnaire_responses").select("partie, created_at").eq("passage", 1),
  ]);
  const liste: Candidat[] = (entrees ?? [])
    // L'écho peut remonter n'importe laquelle de ses réponses, même d'avant un nouveau départ.
    .filter((e) => e.reponse?.trim() && !/^(echo|qc):/.test(e.question_code ?? ""))
    .map((e) => ({ code: e.question_code ?? "", question: e.question, reponse: e.reponse, jour: jourAParis(new Date(e.created_at)) }));

  const jourDe = (p: number) => {
    const l = (parties ?? []).find((x) => x.partie === p);
    return l ? jourAParis(new Date(l.created_at)) : null;
  };
  const ajouter = (partie: number, code: string, question: string, reponse: string | undefined) => {
    const jour = jourDe(partie);
    if (jour && reponse?.trim()) liste.push({ code, question, reponse, jour });
  };
  for (const q of QUESTIONS_OUVERTES) ajouter(1, `q:${q.id}`, q.question, reponses[1][q.id]);
  ajouter(2, "q:appelle", QUESTION_APPELLE, reponses[2].appelle);
  for (const [q, z] of Object.entries(reponses[3].zoom)) {
    ajouter(3, `q:zoom:${q}`, `${QUETE[q as QueteId].nom} : ${ZOOM.autrement}`, z?.autrement);
  }
  ajouter(4, "q:pasencore", QUESTION_PAS_ENCORE, reponses[4].pasEncore);
  return liste;
}
