/** Découpe prompts/moteur-ecriture.md et specs/mondes-v0.md. Pur, testé. */
import type { MondeId } from "@/lib/questionnaire/contenu";

export function decouperPrompt(md: string): { ecriture: string; verification: string } {
  const blocs = md.split(/^---\s*$/m);
  // blocs[0] : présentation ; blocs[1] : prompt d'écriture ; blocs[2] : seconde passe ; ensuite : les emplacements.
  const principal = (blocs[1] ?? "").trim();
  const secondePasse = (blocs[2] ?? "").trim();
  // La suite est rangée par titre : « # Emplacement … » va à l'écriture, « # Seconde passe … » à la vérification.
  const sections = blocs
    .slice(3)
    .join("\n")
    .split(/^(?=# )/m)
    .map((x) => x.trim())
    .filter(Boolean);
  const emplacements = sections.filter((x) => !x.startsWith("# Seconde passe")).join("\n\n");
  const secondeCarte = sections.filter((x) => x.startsWith("# Seconde passe")).join("\n\n");
  return { ecriture: `${principal}\n\n${emplacements}`.trim(), verification: `${secondePasse}\n\n${secondeCarte}`.trim() };
}

export function decouperMondes(plans: string): Record<MondeId, string> {
  const section = (titre: string) => {
    const debut = plans.indexOf(titre);
    if (debut < 0) return "";
    const reste = plans.slice(debut + titre.length);
    const fin = reste.search(/^## /m);
    return (titre + (fin >= 0 ? reste.slice(0, fin) : reste)).trim();
  };
  return {
    histoire: section("## Monde 1 : Histoire"),
    philosophie_pratique: section("## Monde 2 : Philosophie pratique"),
    attention_reseaux: section("## Monde 3 : Attention et réseaux"),
  };
}
