/** Découpe prompts/moteur-ecriture.md et specs/mondes-v0.md. Pur, testé. */
import type { MondeId } from "@/lib/questionnaire/contenu";

export function decouperPrompt(md: string): { ecriture: string; verification: string } {
  const blocs = md.split(/^---\s*$/m);
  // blocs[0] : présentation ; blocs[1] : prompt d'écriture ; blocs[2] : seconde passe ; ensuite : emplacements carte
  const principal = (blocs[1] ?? "").trim();
  const secondePasse = (blocs[2] ?? "").trim();
  const suite = blocs.slice(3).join("\n---\n");
  const iSeconde = suite.indexOf("# Seconde passe pour ces emplacements");
  const emplacements = (iSeconde >= 0 ? suite.slice(0, iSeconde) : suite).trim();
  const secondeCarte = iSeconde >= 0 ? suite.slice(iSeconde).trim() : "";
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
