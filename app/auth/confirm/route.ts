import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { createClient } from "@/lib/supabase/server";

/**
 * Arrivée depuis le lien magique.
 * Accepte les deux formats de lien Supabase :
 *  - ?token_hash=...&type=email (recommandé : marche même si le lien s'ouvre sur un autre appareil)
 *  - ?code=... (format par défaut)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/connexion?erreur=lien", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isEmailAllowed(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/connexion?erreur=liste", origin));
  }

  return NextResponse.redirect(new URL("/espace", origin));
}
