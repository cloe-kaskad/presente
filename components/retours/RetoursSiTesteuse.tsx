import { estTesteuse } from "@/lib/equipe";
import { createClient } from "@/lib/supabase/server";
import { BoutonRetour } from "./BoutonRetour";

/** Le bouton « Un retour ? », seulement pour l'équipe et les testeuses (TESTEUSES_EMAILS). Jamais pour une cliente. */
export async function RetoursSiTesteuse() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user && estTesteuse(user.email) ? <BoutonRetour /> : null;
  } catch {
    return null;
  }
}
