import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { MondeId } from "@/lib/questionnaire/contenu";
import { decouperMondes, decouperPrompt } from "./decoupage";

/**
 * Les prompts du moteur sont lus dans prompts/moteur-ecriture.md : c'est le fichier de référence,
 * modifiable sans toucher au code. Les plans des mondes viennent de specs/mondes-v0.md.
 */
let cache: { ecriture: string; verification: string; mondes: Record<MondeId, string> } | null = null;

function charger() {
  if (cache) return cache;
  const prompt = fs.readFileSync(path.join(process.cwd(), "prompts", "moteur-ecriture.md"), "utf8");
  const plans = fs.readFileSync(path.join(process.cwd(), "specs", "mondes-v0.md"), "utf8");
  cache = { ...decouperPrompt(prompt), mondes: decouperMondes(plans) };
  return cache;
}

export const promptEcriture = () => charger().ecriture;
export const promptVerification = () => charger().verification;
export const planDuMonde = (m: MondeId) => charger().mondes[m];
