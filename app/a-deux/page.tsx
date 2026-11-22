import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { codeMot, codeReponse, etatBuddy, plusTard, finDuCheminADeux, numeroAccessible, pointDuMois, prochaineQuestionLe } from "@/lib/buddy/etat";
import { dateEnLettres, jourAParis } from "@/lib/rituel/citations";
import { INES, MENTION_TEST, phraseRetenueParInes } from "@/lib/buddy/profil-test";
import { QUESTIONS_BUDDY_MOIS, phrasesDe } from "@/lib/buddy/questions";
import { parseAllowedEmails } from "@/lib/allowed-emails";
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
  const etatReel = etatBuddy(chemin.progression, chemin.semaine);
  // Après un « Pas maintenant », le lien « Voir » en bas de Mon chemin rouvre la proposition.
  const etat = plusTard(chemin.progression, etatReel) ? "proposee" : etatReel;
  if (etat === "rien") redirect("/chemin");

  const [{ data: profil }, carnet] = await Promise.all([supabase.from("profiles").select("prenom").maybeSingle(), chargerCarnet(supabase)]);
  const ecrit = (code: string) => carnet.find((e) => e.code === code)?.reponse ?? "";
  const mois = Math.min(2, Math.floor((chemin.semaine - 1) / 4));
  const quete = QUETE[chemin.quetes[mois]].nom;
  const montre = chemin.progression.buddy_montre ?? 3;
  // Inès se cale sur la testeuse : en chemin depuis à peu près aussi longtemps (un jour de plus).
  const joursInes = Math.max(1, Math.round((Date.now() - Date.parse(`${String(chemin.dateDebut).slice(0, 10)}T12:00:00Z`)) / 864e5) + 1);
  if (etat === "proposee") await noter(supabase, "buddy_explication_vue", { semaine: chemin.semaine, pathId: chemin.id, unique: true });
  const p = chemin.progression;
  const numero = numeroAccessible(p);
  const maReponse = (n: number) => ecrit(codeReponse(p, n));
  // La réponse d'Inès, une fois la sienne donnée (le serveur ne l'envoie pas avant). Aux questions « quelle phrase
  // t'est restée ? », elle reprend une phrase de ce que la testeuse a écrit ce mois-ci.
  const reponseInes = (n: number) => {
    if (!maReponse(n)) return null;
    const q = QUESTIONS_BUDDY_MOIS[n - 1];
    if (!q.phrase) return INES.reponses[n - 1] ?? null;
    const sesMots = [n - 3, n - 2, n - 1].map(maReponse).filter(Boolean);
    const retenue = phraseRetenueParInes(sesMots);
    return retenue ? `« ${retenue} » ${INES.reponses[n - 1]}` : INES.reponses[n - 1];
  };
  const questions = QUESTIONS_BUDDY_MOIS.slice(0, numero).map((q, i) => {
    const n = i + 1;
    // Pour la question « quelle phrase t'est restée ? » : les phrases d'Inès ce mois-ci, à toucher.
    const phrasesInes = q.phrase ? [n - 3, n - 2, n - 1].flatMap((k) => (maReponse(k) ? phrasesDe(INES.reponses[k - 1] ?? "") : [])) : [];
    return {
      numero: n,
      mois: q.mois,
      texte: q.texte,
      phrase: Boolean(q.phrase),
      phrasesAutre: phrasesInes,
      maReponse: maReponse(n),
      saReponse: reponseInes(n),
      monMot: ecrit(codeMot(p, n)),
      sonMot: maReponse(n) && n % 2 === 0 ? (INES.mots[n] ?? null) : null,
    };
  });
  const derniere = questions[questions.length - 1];
  // « Prochaine question lundi 30 novembre. » : 7 jours après le début de la question en cours.
  const point = pointDuMois(p, numero, Boolean(derniere?.maReponse));
  const bloquee = (numero === 4 && p.buddy_suite_m1 !== 1) || (numero === 8 && p.buddy_suite_m2 !== 1);
  const suivante = numero < 12 && !bloquee ? dateEnLettres(jourAParis(new Date(prochaineQuestionLe(p, numero) * 1000))) : null;
  const fin = finDuCheminADeux(p, Boolean(maReponse(12))) ? (p.buddy_fin === 1 ? "oui" : p.buddy_fin === 2 ? "non" : "question") : null;
  // « Quelque chose me gêne » : un message à l'équipe (la première adresse de EQUIPE_EMAILS).
  const contactEquipe = [...parseAllowedEmails(process.env.EQUIPE_EMAILS)][0] ?? null;

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
        questions={questions}
        point={point}
        fin={fin}
        contactEquipe={contactEquipe}
      />
    </>
  );
}
