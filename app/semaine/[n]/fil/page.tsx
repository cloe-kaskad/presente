import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { tirerLeFil } from "@/lib/catalogue/fil";
import { QUETE } from "@/lib/questionnaire/contenu";
import { contexteSemaine } from "../contexte";
import { Fil } from "./Fil";

export const metadata = { title: "Tirer le fil · Présente !" };

export default async function PageFil({ params }: { params: Promise<{ n: string }> }) {
  const ctx = await contexteSemaine(Number((await params).n));
  const { n, d, quete, chemin, initiales } = ctx;
  if (d !== 1 && d !== 3) redirect(`/semaine/${n}`);
  const fil = await tirerLeFil(quete, d);
  if (!fil) redirect(`/semaine/${n}`); // rien de validé pour cette semaine : l'étape n'existe pas
  return (
    <>
      <BarreEspace courante="chemin" />
      <Fil
        n={n}
        surtitre={`Tirer le fil · ${QUETE[quete].nom}, semaine ${d} · 5 minutes`}
        fil={fil}
        garde={initiales[`s${n}:fil`]?.reponse ?? ""}
        luLe={chemin.progression[`fil${n}`] ?? null}
      />
    </>
  );
}
