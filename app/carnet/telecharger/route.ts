import { NextResponse } from "next/server";
import { chargerChemin } from "@/lib/chemin/donnees";
import { sesReponses } from "@/lib/moteur/ecriture";
import { chargerReponses } from "@/lib/questionnaire/donnees";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { LIBELLES_RETOURS, infosDesSemaines } from "@/lib/semaines/fil-donnees";
import { dateDeNote, filDuCarnet, periode } from "@/lib/semaines/fil-du-carnet";
import { createClient } from "@/lib/supabase/server";

/** Son carnet en texte brut, pour le garder chez elle : même ordre et mêmes regroupements que la page. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));
  const chemin = await chargerChemin(supabase);
  if (!chemin) return NextResponse.redirect(new URL("/questionnaire", request.url));

  const [entrees, reponses, infos] = await Promise.all([chargerCarnet(supabase), chargerReponses(supabase, 1), infosDesSemaines(chemin)]);
  const semaines = filDuCarnet({ entrees, infos, semaineCourante: chemin.semaine, retours: LIBELLES_RETOURS });
  const lignes: string[] = ["Mon carnet · Présente !", ""];
  for (const s of semaines) {
    lignes.push("", `/ ${s.titre} · ${periode(s.premier, s.dernier)} /`, "");
    for (const n of s.notes) {
      lignes.push(`${dateDeNote(n.jour)} · ${n.origine}${n.pastille ? ` (${n.pastille})` : ""}`);
      for (const l of n.lignes) lignes.push(l.question, l.reponse);
      lignes.push("");
    }
  }
  const debut = sesReponses(reponses).filter((r) => !r.question.includes("phrase qu'elle a cochée"));
  if (debut.length) {
    lignes.push("", "/ Au début du chemin /", "");
    for (const d of debut) lignes.push(d.question, d.reponse, "");
  }
  return new NextResponse(lignes.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mon-carnet-presente.txt"',
      "Cache-Control": "no-store",
    },
  });
}
