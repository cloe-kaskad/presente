import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { chargerCatalogue } from "@/lib/catalogue/airtable";
import { AUDIO_PROVISOIRE, guideDeLaSemaine } from "@/lib/catalogue/guides";
import { MODE_TEST } from "@/lib/mode-test";
import { contexteSemaine } from "../contexte";
import { Pause } from "./Pause";

export const metadata = { title: "Une pause guidée · Présente !" };

/**
 * La pause guidée des semaines 2 et 4 (celles du monde) : une visualisation ou une respiration à la voix de Cloé,
 * à la place de « Tirer le fil ». Elle ne remplace jamais l'exercice.
 */
export default async function PagePause({ params }: { params: Promise<{ n: string }> }) {
  const ctx = await contexteSemaine(Number((await params).n));
  const { n, d, quete, chemin } = ctx;
  if (d !== 2 && d !== 4) redirect(`/semaine/${n}`);
  const { catalogue } = await chargerCatalogue();
  const guide = guideDeLaSemaine(catalogue.pratiques, quete, n);
  if (!guide?.audio) redirect(`/semaine/${n}`);
  return (
    <>
      <BarreEspace courante="chemin" />
      <Pause
        n={n}
        nom={guide.nom}
        enBref={guide.enBref}
        consigne={guide.consigne}
        guidage={{ cle: guide.id, fichier: guide.audio, provisoire: MODE_TEST ? AUDIO_PROVISOIRE : null }}
        faiteLe={chemin.progression[`pause${n}`] ?? null}
      />
    </>
  );
}
