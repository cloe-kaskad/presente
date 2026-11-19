import "server-only";

/**
 * L'aperçu d'un contenu à partir de son lien (balises Open Graph de la page) :
 * l'image de couverture et le résumé officiel, quand Airtable ne les fournit pas.
 * Mis en cache une semaine. En cas d'échec, on renvoie simplement rien.
 */
export type Apercu = { image: string | null; description: string | null };

const VIDE: Apercu = { image: null, description: null };
const CACHE_SECONDES = 60 * 60 * 24 * 7;

function decoder(t: string): string {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Toutes les balises <meta>, sous forme { property|name : content }. */
export function lireMetas(html: string): Record<string, string> {
  const metas: Record<string, string> = {};
  for (const balise of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const m of balise.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
    }
    const cle = (attrs.property || attrs.name || "").toLowerCase();
    if (cle && attrs.content && !(cle in metas)) metas[cle] = decoder(attrs.content).trim();
  }
  return metas;
}

/** Un résumé lisible : 420 caractères au plus, coupé en fin de phrase si possible. */
export function resumer(t: string, max = 420): string {
  const propre = t.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max);
  const fin = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "), coupe.lastIndexOf("? "));
  return fin > max * 0.5 ? coupe.slice(0, fin + 1) : `${coupe.slice(0, coupe.lastIndexOf(" "))}…`;
}

export function apercuDepuisHtml(html: string, url: string): Apercu {
  const m = lireMetas(html);
  const image = m["og:image"] || m["og:image:url"] || m["twitter:image"] || null;
  const description = m["og:description"] || m["twitter:description"] || m["description"] || null;
  let imageAbsolue: string | null = null;
  if (image) {
    try {
      imageAbsolue = new URL(image, url).toString();
    } catch {
      imageAbsolue = null;
    }
  }
  return { image: imageAbsolue, description: description ? resumer(description) : null };
}

export async function apercuDuLien(url: string | null): Promise<Apercu> {
  if (!url || !/^https?:\/\//.test(url)) return VIDE;
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Presente/1.0)", "accept-language": "fr-FR,fr;q=0.9" },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: CACHE_SECONDES, tags: ["apercu"] },
    });
    if (!r.ok) return VIDE;
    const html = (await r.text()).slice(0, 500_000);
    return apercuDepuisHtml(html, url);
  } catch {
    return VIDE;
  }
}
