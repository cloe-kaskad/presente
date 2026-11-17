import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/allowed-emails";

/** Pages accessibles sans être connectée. */
const PUBLIC_PATHS = ["/", "/connexion", "/confidentialite", "/auth/confirm", "/auth/deconnexion"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

/** Rafraîchit la session Supabase et protège les pages privées. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Supabase pas encore configuré : les pages publiques restent visibles.
    if (isPublic(request.nextUrl.pathname)) return response;
    return NextResponse.redirect(new URL("/connexion?erreur=config", request.url));
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Ne rien intercaler entre la création du client et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return response;

  if (!user) {
    const redirect = new URL("/connexion", request.url);
    return NextResponse.redirect(redirect);
  }

  if (!isEmailAllowed(user.email)) {
    // Retirée de la liste blanche entre-temps : on la déconnecte.
    await supabase.auth.signOut();
    const redirect = NextResponse.redirect(new URL("/connexion?erreur=liste", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
