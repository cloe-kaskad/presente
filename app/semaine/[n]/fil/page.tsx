import { redirect } from "next/navigation";
import { BarreEspace } from "@/components/BarreEspace";
import { tirerLeFil } from "@/lib/catalogue/fil";
import { QUETE } from "@/lib/questionnaire/contenu";
import { libelleCapacite } from "@/lib/questionnaire/contenu";
import { contexteSemaine, queteDeLaSemaine } from "../contexte";
import { Fil } from "./Fil";

export const metadata = { title: "Tirer le fil · Présente !" };

export default async function PageFil({ params }: { params: Promise<{ n: string }> }) {
  const ctx = await contexteSemaine(Number((await params).n));
  const { n, d, quete, chemin, initiales } = ctx;
  if (d !== 1 && d !== 3) redirect(`/semaine/${n}`);
  // La lecture de la capacité travaillée cette semaine : le même focus que le contenu et l'exercice.
  const code = ctx.caps[d === 1 ? 0 : 1];
  const [fil, q] = await Promise.all([tirerLeFil(quete, d, code), queteDeLaSemaine(ctx)]);
  if (!fil) redirect(`/semaine/${n}`); // rien de validé pour cette semaine : l'étape n'existe pas
  const typeContenu = (q.contenu?.type ?? "").toLowerCase();
  return (
    <>
      <BarreEspace courante="chemin" />
      <Fil
        n={n}
        surtitre={`Tirer le fil · ${QUETE[quete].nom}, semaine ${d} · 5 minutes`}
        fil={fil}
        focus={{
          capacite: libelleCapacite(code),
          contenu: q.contenu ? { titre: q.contenu.titre, nature: typeContenu ? `le ${typeContenu}` : "le contenu" } : null,
          exercice: q.pratique ? { nom: q.pratique.nom, geste: d === 3 } : null,
        }}
        garde={initiales[`s${n}:fil`]?.reponse ?? ""}
        luLe={chemin.progression[`fil${n}`] ?? null}
      />
    </>
  );
}
