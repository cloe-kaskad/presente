/**
 * « Revenir à la première semaine » (panneau de test) : un nouveau départ. Ce qu'elle a écrit n'est jamais effacé :
 * les réponses des semaines (codes « s1:… ») sont mises de côté, et celles du nouveau départ sont rangées à part,
 * avec le numéro du départ devant le code (« r2:s1:… »). progression.depart garde ce numéro (0 ou absent : le premier).
 * L'échange à deux (« buddy:… ») est mis de côté de la même façon. Les réponses du jour (Question Chérie, écho)
 * ne bougent pas.
 */
const DE_SEMAINE = /^(s\d+|buddy):/;
const AVEC_DEPART = /^r(\d+):(.*)$/;

export const departDe = (progression: Record<string, number> | null | undefined) => Math.max(0, Math.floor(progression?.depart ?? 0));

/** Le code tel qu'il est rangé dans la base. */
export function codeRange(code: string, depart: number): string {
  return depart > 0 && DE_SEMAINE.test(code) ? `r${depart}:${code}` : code;
}

/** Le code tel que les pages le connaissent, ou null si la réponse appartient à un autre départ (mise de côté). */
export function codeLu(range: string, depart: number): string | null {
  const m = AVEC_DEPART.exec(range);
  if (m) return Number(m[1]) === depart ? m[2] : null;
  if (depart > 0 && DE_SEMAINE.test(range)) return null;
  return range;
}

/**
 * Le vrai stade, gardé de côté pendant la démo : chaque clé de sa progression d'avant, préfixée « reel: »,
 * et le jour de début (« reel:date_debut », en secondes). « Revenir au stade réel » le remet en place.
 */
const REEL = "reel:";
export const enDemo = (p: Record<string, number>) => Object.keys(p).some((k) => k.startsWith(REEL));

export function nouveauDepart(p: Record<string, number>, dateDebut: string | null | undefined): Record<string, number> {
  const reel = enDemo(p)
    ? Object.fromEntries(Object.entries(p).filter(([k]) => k.startsWith(REEL)))
    : {
        ...Object.fromEntries(Object.entries(p).map(([k, v]) => [`${REEL}${k}`, v])),
        ...(dateDebut ? { [`${REEL}date_debut`]: Math.floor(Date.parse(`${String(dateDebut).slice(0, 10)}T12:00:00Z`) / 1000) } : {}),
      };
  // Des numéros toujours nouveaux, même après un retour au stade réel : une démo ne retrouve jamais la précédente.
  const depart = Math.max(departDe(p), p.depart_max ?? 0) + 1;
  const echange = Math.max(p.buddy_echange ?? 0, p[`${REEL}buddy_echange`] ?? 0, p.buddy_max ?? 0) + 1;
  return { ...reel, depart, depart_max: depart, buddy_echange: echange, buddy_max: echange };
}

/** Sa vraie progression et son vrai jour de début, si une démo est en cours ; sinon null. */
export function stadeGarde(p: Record<string, number>): { progression: Record<string, number>; dateDebut: string | null } | null {
  if (!enDemo(p)) return null;
  const progression: Record<string, number> = {};
  let dateDebut: string | null = null;
  for (const [k, v] of Object.entries(p)) {
    if (!k.startsWith(REEL)) continue;
    const cle = k.slice(REEL.length);
    if (cle === "date_debut") dateDebut = new Date(v * 1000).toISOString().slice(0, 10);
    else progression[cle] = v;
  }
  // Les compteurs de démo restent, pour que la prochaine démo reparte d'une page blanche.
  if (p.depart_max !== undefined) progression.depart_max = p.depart_max;
  if (p.buddy_max !== undefined) progression.buddy_max = p.buddy_max;
  return { progression, dateDebut };
}
