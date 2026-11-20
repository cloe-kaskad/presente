import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { chargerChemin } from "@/lib/chemin/donnees";
import { sesReponses } from "@/lib/moteur/ecriture";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { LIBELLES_RETOURS, infosDesSemaines } from "@/lib/semaines/fil-donnees";
import { filDuCarnet } from "@/lib/semaines/fil-du-carnet";
import { createClient } from "@/lib/supabase/server";
import { Carnet } from "./Carnet";

export const metadata = { title: "Mon carnet · Présente !" };

export default async function PageCarnet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const [entrees, reponses, infos] = await Promise.all([chargerCarnet(supabase), chargerReponses(supabase, 1), infosDesSemaines(chemin)]);
  const semaines = filDuCarnet({ entrees, infos, semaineCourante: chemin.semaine, retours: LIBELLES_RETOURS });
  // Au début du chemin : ses réponses ouvertes au questionnaire (pas les phrases cochées).
  const debut = sesReponses(reponses).filter((r) => !r.question.includes("phrase qu'elle a cochée"));

  return (
    <>
      <BarreEspace courante="carnet" />
      <Carnet semaines={semaines} debut={debut} />
    </>
  );
}
