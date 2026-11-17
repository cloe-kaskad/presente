/** Lecture des variables d'environnement, avec un message clair si l'une manque. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `La variable d'environnement ${name} est manquante. Ajoute-la dans Vercel (ou dans .env.local en local).`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  // Accès statique pour que Next.js puisse l'injecter côté navigateur.
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("La variable NEXT_PUBLIC_SUPABASE_URL est manquante.");
  return v;
}

export function supabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error("La variable NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante.");
  return v;
}
