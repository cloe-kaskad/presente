import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { chargerChemin } from "@/lib/chemin/donnees";
import { sesReponses } from "@/lib/moteur/ecriture";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { RETOURS, etiquetteSemaine } from "@/lib/semaines/etiquettes";
import { createClient } from "@/lib/supabase/server";
import { Carnet, type Groupe } from "./Carnet";

export const metadata = { title: "Mon carnet · Présente !" };

export default async function PageCarnet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");

  const [entrees, reponses] = await Promise.all([chargerCarnet(supabase), chargerReponses(supabase, 1)]);

  const groupes: Groupe[] = [];
  for (const e of entrees) {
    const lignes = [];
    if (e.reponse.trim()) lignes.push({ question: e.question, reponse: e.reponse.trim() });
    const r = RETOURS.find((x) => x.id === e.retour);
    if (r) lignes.push({ question: "Ce contenu, pour toi", reponse: r.label, geste: true });
    if (!lignes.length) continue;
    const titre = etiquetteSemaine(chemin, e.semaine);
    const g = groupes.find((x) => x.titre === titre) ?? groupes[groupes.push({ titre, lignes: [] }) - 1];
    g.lignes.push(...lignes);
  }
  // Au début du chemin : ses réponses ouvertes au questionnaire (pas les phrases cochées).
  const debut = sesReponses(reponses).filter((r) => !r.question.includes("phrase qu'elle a cochée"));
  if (debut.length) groupes.push({ titre: "Au début du chemin", lignes: debut });

  return (
    <>
      <BarreEspace courante="carnet" />
      <Carnet groupes={groupes} />
    </>
  );
}
