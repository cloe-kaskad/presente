import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { codeReponse, debutEchange, etatBuddy, numeroDeQuestion, prochaineQuestionLe } from "@/lib/buddy/etat";
import { dateEnLettres, jourAParis } from "@/lib/rituel/citations";
import { INES, MENTION_TEST } from "@/lib/buddy/profil-test";
import { QUESTIONS_BUDDY } from "@/lib/buddy/questions";
import { chargerChemin } from "@/lib/chemin/donnees";
import { prenomAffiche } from "@/lib/chemin/textes";
import { QUETE } from "@/lib/questionnaire/contenu";
import { chargerCarnet } from "@/lib/semaines/carnet";
import { noter } from "@/lib/mesure/noter";
import { createClient } from "@/lib/supabase/server";
import { Buddy } from "./Buddy";

export const metadata = { title: "Un bout de chemin à deux · Présente !" };

/**
 * La buddy (brief V0.10). En test, l'autre est un profil fictif, Inès, toujours signalé comme tel.
 * Rien d'autre n'est jamais partagé : ni le carnet, ni le journal, ni la carte.
 */
export default async function PageBuddy() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const chemin = await chargerChemin(supabase);
  if (!chemin) redirect("/questionnaire");
  const etat = etatBuddy(chemin.progression, chemin.semaine);
  if (etat === "rien") redirect("/chemin");

  const [{ data: profil }, carnet] = await Promise.all([supabase.from("profiles").select("prenom").maybeSingle(), chargerCarnet(supabase)]);
  const ecrit = (code: string) => carnet.find((e) => e.code === code)?.reponse ?? "";
  const mois = Math.min(2, Math.floor((chemin.semaine - 1) / 4));
  const quete = QUETE[chemin.quetes[mois]].nom;
  const montre = chemin.progression.buddy_montre ?? 3;
  // Inès se cale sur la testeuse : en chemin depuis à peu près aussi longtemps (un jour de plus).
  const joursInes = Math.max(1, Math.round((Date.now() - Date.parse(`${String(chemin.dateDebut).slice(0, 10)}T12:00:00Z`)) / 864e5) + 1);
  if (etat === "proposee") await noter(supabase, "buddy_explication_vue", { semaine: chemin.semaine, pathId: chemin.id, unique: true });
  const numero = numeroDeQuestion(debutEchange(chemin.progression), Date.now() / 1000, QUESTIONS_BUDDY.length);
  // « Prochaine question lundi 30 novembre. » : 7 jours après le début de la question en cours.
  const suivante = numero < QUESTIONS_BUDDY.length ? dateEnLettres(jourAParis(new Date(prochaineQuestionLe(chemin.progression, numero) * 1000))) : null;

  return (
    <>
      <BarreEspace courante="chemin" />
      <Buddy
        etat={etat}
        moi={{
          prenom: prenomAffiche(profil?.prenom) ?? null,
          quete,
          presentation: ecrit("buddy:presentation"),
          montrePrenom: (montre & 1) === 1,
          montreQuete: (montre & 2) === 2,
        }}
        autre={{ prenom: INES.prenom, quete, presentation: INES.presentation, mention: MENTION_TEST, jours: joursInes }}
        prochaine={suivante ? suivante.charAt(0).toLowerCase() + suivante.slice(1) : null}
        questions={QUESTIONS_BUDDY.slice(0, numero).map((q, i) => ({
          numero: i + 1,
          texte: q,
          maReponse: ecrit(codeReponse(chemin.progression, i + 1)),
          // La réponse de l'autre ne s'affiche que quand elle a elle-même répondu (le serveur ne l'envoie pas avant).
          saReponse: ecrit(codeReponse(chemin.progression, i + 1)) ? (INES.reponses[i] ?? null) : null,
        }))}
      />
    </>
  );
}
