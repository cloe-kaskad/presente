import { redirect } from "next/navigation";
import { chargerChemin } from "@/lib/chemin/donnees";
import { prenomAffiche } from "@/lib/chemin/textes";
import { racinesAEviter, toucheSujet } from "@/lib/catalogue/filtres";
import { QUESTIONS_OUVERTES } from "@/lib/questionnaire/contenu";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { createClient } from "@/lib/supabase/server";
import { Trace } from "./Trace";

export const metadata = { title: "On trace ton chemin · Présente !" };
// Le moteur écrit pendant cet écran : on lui laisse jusqu'à deux minutes.
export const maxDuration = 120;

const LONGUEUR_CITATION = 60;

export default async function PageTrace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const [{ data: profil }, reponses] = await Promise.all([
    supabase.from("profiles").select("prenom, sujets_a_eviter, detresse_le").maybeSingle(),
    chargerReponses(supabase, 1),
  ]);
  if (profil?.detresse_le) redirect("/quand-ca-ne-va-pas");

  // Une de ses phrases, courte, pour « On relit ce que tu as écrit ».
  const aEviter = racinesAEviter(profil?.sujets_a_eviter);
  const candidates = [
    ...chemin.quetes.map((q) => reponses[3].zoom[q]?.autrement),
    reponses[2].appelle,
    ...QUESTIONS_OUVERTES.map((q) => reponses[1][q.id]?.split(/(?<=[.!?])\s/)[0]),
  ]
    .map((t) => t?.trim().replace(/[.!?]+$/, ""))
    .filter((t): t is string => Boolean(t) && t!.length <= LONGUEUR_CITATION && !toucheSujet(aEviter, t));

  return <Trace prenom={prenomAffiche(profil?.prenom)} citation={candidates[0] ?? null} />;
}
