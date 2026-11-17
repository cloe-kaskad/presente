/** Lecture simple par mots-clés : le repli quand Claude n'est pas disponible. */
import { QUETE, codesDe, phraseZoom, type CodeCapacite, type QueteId } from "@/lib/questionnaire/contenu";

const MOTS_QUETE: Record<QueteId, string[]> = {
  argent: ["argent", "compte", "salaire", "finance", "épargne", "dépense", "gagner", "payer", "budget"],
  voix: ["voix", "dire non", "parole", "parler", "oser dire", "limite", "désaccord", "conflit"],
  travail: ["travail", "boulot", "job", "métier", "carrière", "reconversion", "bureau", "poste"],
  emotions: ["émotion", "emotion", "ressens", "colère", "tristesse", "culpabil", "peur"],
  corps: ["corps", "repos", "fatigue", "sport", "image", "désir", "santé"],
  liens: ["lien", "relation", "amitié", "amie", "famille", "couple", "solitude", "entourage"],
  creation: ["création", "creation", "créer", "creer", "écrire", "peindre", "dessiner", "musique", "art"],
};

function normaliser(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Repli : la quête dont le nom ou un mot proche apparaît, seulement s'il n'y en a qu'une. */
export function departageParMots(texte: string, candidates: QueteId[]): QueteId | null {
  const t = normaliser(texte);
  const trouvees = candidates.filter((q) =>
    [QUETE[q].nom.replace(/^(l'|la |le |les )/i, ""), ...MOTS_QUETE[q]].some((m) => t.includes(normaliser(m))),
  );
  return trouvees.length === 1 ? trouvees[0] : null;
}

/** Repli : les capacités dont la phrase partage le plus de mots avec ses réponses ouvertes. */
export function capacitesParMots(
  textes: string,
  quete: QueteId,
  exclues: CodeCapacite[],
  nombre: number,
): CodeCapacite[] {
  // Racines grossières : « culpabilise » et « culpabiliser » se rejoignent.
  const racines = (t: string) =>
    normaliser(t)
      .split(/[^a-z]+/)
      .filter((m) => m.length >= 5)
      .map((m) => m.slice(0, 6));
  const mots = new Set(racines(textes));
  const notes = codesDe(quete)
    .filter((c) => !exclues.includes(c))
    .map((c) => ({
      c,
      n: new Set(racines(phraseZoom(c)).filter((m) => mots.has(m))).size,
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  return notes.slice(0, nombre).map((x) => x.c);
}
