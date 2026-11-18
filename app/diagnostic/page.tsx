import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recalculerMonChemin } from "@/app/carte/actions";
import { chargerChemin } from "@/lib/chemin/donnees";
import { appelerJson, claudeDisponible, modele } from "@/lib/ia/claude";
import { createClient } from "@/lib/supabase/server";
import styles from "./diagnostic.module.css";

export const metadata = { title: "Diagnostic · Présente !" };
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Page de démo : vérifie que le moteur d'écriture fonctionne, sans rien montrer de ses réponses.
 * Elle ne montre que des statuts (« écrit », « secours ») et la raison technique d'un échec.
 */
export default async function Diagnostic() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const test = claudeDisponible()
    ? await appelerJson({
        usage: "diagnostic",
        systeme: "Tu réponds uniquement avec le JSON demandé.",
        message: 'Réponds {"ok": true}.',
        schema: z.object({ ok: z.boolean() }),
      })
    : null;

  const chemin = await chargerChemin(supabase);
  const { data: textes } = chemin
    ? await supabase
        .from("generated_texts")
        .select("emplacement, cle, statut, empreinte_sources, updated_at")
        .eq("path_id", chemin.id)
        .order("emplacement")
    : { data: [] };
  const ecrits = (textes ?? []).filter((t) => t.statut === "ok").length;

  return (
    <main className={styles.page}>
      <Link href="/carte">← Ma carte</Link>
      <h1>Diagnostic du moteur</h1>
      <p>Cette page ne montre aucune de tes réponses : seulement si les textes ont été écrits par Claude ou remplacés par un texte de secours, et pourquoi.</p>

      <h2>Claude</h2>
      <ul>
        <li>Clé ANTHROPIC_API_KEY : {claudeDisponible() ? "présente" : "absente"}</li>
        <li>Modèle : {modele()}</li>
        <li>
          Appel de test :{" "}
          {test === null ? "non lancé (pas de clé)" : test.ok ? `réussi en ${(test.ms / 1000).toFixed(1)} s` : `échec : ${test.raison}`}
        </li>
      </ul>

      <h2>Les textes de ta carte</h2>
      {chemin ? (
        <>
          <p>
            {ecrits} écrits par Claude sur {textes?.length ?? 0}.
          </p>
          <table>
            <thead>
              <tr>
                <th>Emplacement</th>
                <th>Clé</th>
                <th>Statut</th>
                <th>Raison</th>
              </tr>
            </thead>
            <tbody>
              {(textes ?? []).map((t) => (
                <tr key={`${t.emplacement}:${t.cle}`}>
                  <td>{t.emplacement}</td>
                  <td>{t.cle || "·"}</td>
                  <td>{t.statut === "ok" ? "écrit" : "secours"}</td>
                  <td>{t.statut === "ok" ? "" : (t.empreinte_sources ?? "inconnue (texte écrit avant cette page)")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Pas encore de chemin.</p>
      )}
      <form action={recalculerMonChemin}>
        <button type="submit" className="bouton">
          Recalculer mon chemin et réécrire la carte
        </button>
      </form>
    </main>
  );
}
