import "server-only";
import { chargerCatalogue } from "@/lib/catalogue/airtable";
import type { CheminEnregistre } from "@/lib/chemin/donnees";
import { EPISODES } from "./contenu";
import { RETOURS, dansLeMois, etiquetteSemaine, moisDe } from "./etiquettes";
import { joursDuRythme } from "./exercice";
import type { InfoSemaine } from "./fil-du-carnet";

/** Pour chaque semaine du chemin : son titre, son contenu ou son épisode, et sa pratique. */
export async function infosDesSemaines(chemin: CheminEnregistre): Promise<Record<number, InfoSemaine>> {
  const { catalogue } = await chargerCatalogue();
  const contenus = new Map(catalogue.contenus.map((c) => [c.id, c]));
  const pratiques = new Map(catalogue.pratiques.map((p) => [p.id, p]));
  const infos: Record<number, InfoSemaine> = {};
  for (let n = 1; n <= 12; n++) {
    const m = moisDe(n);
    const d = dansLeMois(n);
    const info: InfoSemaine = { titre: etiquetteSemaine(chemin, n) };
    if (d === 1 || d === 3) {
      const choix = chemin.choix[`m${m + 1}s${d}`];
      const c = choix?.contenu ? contenus.get(choix.contenu) : undefined;
      const p = choix?.pratique ? pratiques.get(choix.pratique) : undefined;
      info.contenu = c ? { titre: c.titre, type: c.type } : null;
      info.pratique = p ? { nom: p.nom, agir: d === 3, total: d === 3 ? null : joursDuRythme(p.rythme) } : null;
    } else {
      info.episode = EPISODES[chemin.mondes[m]][d === 2 ? 0 : 1].titre;
    }
    infos[n] = info;
  }
  return infos;
}

export const LIBELLES_RETOURS: Record<string, string> = Object.fromEntries(RETOURS.map((r) => [r.id, r.label]));
