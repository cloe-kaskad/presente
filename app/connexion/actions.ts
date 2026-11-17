"use server";

import { headers } from "next/headers";
import { isEmailAllowed, normalizeEmail } from "@/lib/allowed-emails";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get("email") ?? "");
  const email = normalizeEmail(raw);

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Cette adresse email ne semble pas complète.", email: raw };
  }

  if (!isEmailAllowed(email)) {
    return {
      status: "error",
      message:
        "Cette adresse n'est pas encore invitée. Présente! est en démo privée pour l'instant.",
      email: raw,
    };
  }

  try {
    // Le compte est créé ici, côté serveur, seulement pour les emails de la liste blanche.
    // Les inscriptions libres peuvent ainsi rester fermées dans Supabase.
    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError && createError.status !== 422 && !/already/i.test(createError.message)) {
      console.error("[connexion] création du compte impossible :", createError.code ?? createError.status);
      return { status: "error", message: "Un souci de notre côté. Réessaie dans un instant.", email: raw };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
      },
    });

    if (error) {
      console.error("[connexion] envoi du lien impossible :", error.code ?? error.status);
      const message =
        error.status === 429
          ? "Trop de demandes d'un coup. Attends une minute avant de redemander un lien."
          : "Le lien n'a pas pu partir. Réessaie dans un instant.";
      return { status: "error", message, email: raw };
    }
  } catch (e) {
    console.error("[connexion] configuration incomplète :", e instanceof Error ? e.message : "inconnue");
    return {
      status: "error",
      message: "La connexion n'est pas encore configurée. Réessaie un peu plus tard.",
      email: raw,
    };
  }

  return { status: "sent", email };
}
