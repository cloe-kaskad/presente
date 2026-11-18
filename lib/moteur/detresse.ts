/**
 * Les signaux de détresse forte, repérés par une liste de mots.
 * - « fort » : explicite. Elle voit l'écran « Quand ça ne va pas », quoi qu'en dise Claude.
 * - « ambigu » : peut vouloir dire autre chose (« plus envie de vivre comme ça »).
 *   Claude tranche ; sans Claude, on protège.
 * La vérification par Claude, elle, tourne toujours (lib/moteur/ecriture.ts).
 */

const FORTS = [
  /suicid/,
  /\bme tuer\b/,
  /\b(envie de|veux|voudrais|prefererais) mourir\b/,
  /\bme faire du mal\b/,
  /\bme scarifi/,
  /\bscarification/,
  /\bm'ouvrir les veines\b/,
  /\bmettre fin a mes jours\b/,
  /\ben finir avec la vie\b/,
];

const AMBIGUS = [
  /\ben finir\b/,
  /\bplus envie de vivre\b/,
  /\bpas envie de vivre\b/,
  /\bidees noires\b/,
  /\bdisparaitre\b/,
  /\bplus la force\b/,
  /\bme jeter\b/,
  /\bpendre\b/,
];

export type Signal = "fort" | "ambigu" | null;

export function signauxDeDetresse(textes: string): Signal {
  const t = textes
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "'");
  if (FORTS.some((re) => re.test(t))) return "fort";
  if (AMBIGUS.some((re) => re.test(t))) return "ambigu";
  return null;
}
