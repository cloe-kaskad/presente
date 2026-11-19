import { NextResponse } from "next/server";
import { chargerChemin } from "@/lib/chemin/donnees";
import { sesReponses } from "@/lib/moteur/ecriture";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { RETOURS, etiquetteSemaine } from "@/lib/semaines/etiquettes";
import { createClient } from "@/lib/supabase/server";

/** Son carnet en texte brut, pour le garder chez elle. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));
  const chemin = await chargerChemin(supabase);
  if (!chemin) return NextResponse.redirect(new URL("/questionnaire", request.url));

  const [entrees, reponses] = await Promise.all([chargerCarnet(supabase), chargerReponses(supabase, 1)]);
  const lignes: string[] = ["Mon carnet · Présente !", ""];
  let titre = "";
  for (const e of entrees) {
    const r = RETOURS.find((x) => x.id === e.retour);
    if (!e.reponse.trim() && !r) continue;
    const t = etiquetteSemaine(chemin, e.semaine);
    if (t !== titre) {
      lignes.push("", `/ ${t} /`, "");
      titre = t;
    }
    if (e.reponse.trim()) lignes.push(e.question, `« ${e.reponse.trim()} »`, "");
    if (r) lignes.push(`Ce contenu, pour toi : ${r.label}`, "");
  }
  const debut = sesReponses(reponses).filter((r) => !r.question.includes("phrase qu'elle a cochée"));
  if (debut.length) {
    lignes.push("", "/ Au début du chemin /", "");
    for (const d of debut) lignes.push(d.question, `« ${d.reponse} »`, "");
  }
  return new NextResponse(lignes.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mon-carnet-presente.txt"',
      "Cache-Control": "no-store",
    },
  });
}
