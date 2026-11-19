/** La fiche d'un épisode, tirée du plan des mondes : le déroulé en quelques idées, et les lectures. Pur, testé. */

function nettoyer(t: string): string {
  return t
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function ficheDeLEpisode(planDuMonde: string, numero: 1 | 2): { idees: string[]; lectures: string | null } {
  const sections = planDuMonde.split(/^### /m);
  const ep = sections.find((s) => s.startsWith(`Épisode ${numero}`)) ?? "";
  const deroule = ep.split(/\*\*Déroulé\*\*/)[1]?.split(/\n\*\*[A-ZÉ]/)[0] ?? "";
  const idees = deroule
    .split("\n")
    .filter((l) => /^\s*(\d+\.|-)\s/.test(l))
    .map((l) => nettoyer(l.replace(/^\s*(\d+\.|-)\s/, "")))
    // « 0 à 3 min, la scène. Un guichet… » : on retire le minutage.
    .map((l) => l.replace(/^\d+ à \d+ min, [^.]+\.\s*/, ""))
    .filter((l) => l.length > 0);
  const reco = (ep.match(/\*\*(Recommandations pour les fiches|Sources à exploiter pour l'écriture)\.\*\*([^\n]+)/) ?? [])[2];
  return { idees, lectures: reco ? nettoyer(reco) : null };
}
