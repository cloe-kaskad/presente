import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { CITATIONS, dateEnLettres, jourAParis, numeroDuJour } from "@/lib/rituel/citations";
import { codeJour, codeRetiens, estCodeJour, etatExercice, jourDuCode, jourEnCours, joursDuRythme } from "@/lib/semaines/exercice";
import { contexteSemaine, introDeLaPratique, queteDeLaSemaine } from "../contexte";
import { AUDIO_PROVISOIRE } from "@/lib/catalogue/guides";
import { MODE_TEST } from "@/lib/mode-test";
import { Exercice } from "./Exercice";

export const metadata = { title: "Ton exercice · Présente !" };
// Si l'introduction n'est pas encore écrite, elle s'écrit ici : on laisse du temps au moteur.
export const maxDuration = 180;

export default async function PageExercice({ params }: { params: Promise<{ n: string }> }) {
  const ctx = await contexteSemaine(Number((await params).n));
  const { n, d, chemin, decetteSemaine } = ctx;
  if (d !== 1 && d !== 3) redirect(`/semaine/${n}`);

  const q = await queteDeLaSemaine(ctx);
  const { pratique, contenu } = q;
  if (!pratique) redirect(`/semaine/${n}`);
  const etat = etatExercice({ n, progression: chemin.progression, semaineCourante: chemin.semaine, entrees: decetteSemaine });
  if (!etat) redirect(`/semaine/${n}`); // pas encore créé : on passe d'abord par le contenu et le carnet
  const intro = await introDeLaPratique(ctx, q);

  const aujourdhui = jourAParis();
  const agir = d === 3;
  const total = agir ? null : joursDuRythme(pratique.rythme);
  const ecrit = decetteSemaine.filter((e) => e.reponse.trim());
  const jours = ecrit
    .filter((e) => estCodeJour(n, e.code))
    .map((e) => ({ jour: jourDuCode(e.code), date: dateEnLettres(jourDuCode(e.code)), reponse: e.reponse }))
    .sort((a, b) => (a.jour < b.jour ? 1 : -1));
  // Ce qu'elle a écrit avant cette page (exercice en un bloc), à garder visible.
  const autres = ecrit
    .filter((e) => (e.code.startsWith(`s${n}:exo:`) || e.code.startsWith(`s${n}:acte:`)) && !estCodeJour(n, e.code) && e.code !== codeRetiens(n))
    .map((e) => ({ code: e.code, question: e.question.replace(`${pratique.nom} · `, ""), reponse: e.reponse }));
  const citation = CITATIONS[(numeroDuJour(aujourdhui) + n * 5) % CITATIONS.length];
  const typeContenu = (contenu?.type ?? "").toLowerCase();

  return (
    <>
      <BarreEspace courante="chemin" />
      <Exercice
        n={n}
        agir={agir}
        etat={etat}
        pratique={{
          nom: pratique.nom,
          consigne: pratique.consigne ?? pratique.enBref,
          regles: pratique.regles,
          pourquoi: pratique.pourquoiCaCompte,
          rythme: pratique.rythme,
          forme: pratique.formeReponse,
          guidage: pratique.audio ? { cle: pratique.id, fichier: pratique.audio, provisoire: MODE_TEST ? AUDIO_PROVISOIRE : null } : null,
        }}
        intro={intro}
        origine={contenu ? { titre: contenu.titre, type: typeContenu } : null}
        total={total}
        jourCourant={total ? jourEnCours(total, jours.map((j) => j.jour), aujourdhui) : null}
        aujourdhui={{ code: codeJour(n, aujourdhui), date: dateEnLettres(aujourdhui), reponse: jours.find((j) => j.jour === aujourdhui)?.reponse ?? "" }}
        jours={jours}
        autres={autres}
        initiales={Object.fromEntries(decetteSemaine.map((e) => [e.code, e.reponse]))}
        citation={citation}
      />
    </>
  );
}
