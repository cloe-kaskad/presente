import Link from "next/link";
import { notFound } from "next/navigation";
import { estEquipe } from "@/lib/equipe";
import type { RetourLu } from "@/lib/retours/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ListeRetours } from "./ListeRetours";
import styles from "./retours.module.css";

export const metadata = { title: "Retours des testeuses · Présente !", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Les retours des testeuses (brief V0.13, point 4). Réservé à l'équipe (EQUIPE_EMAILS), sinon 404. */
export default async function PageRetours() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estEquipe(user.email)) notFound();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("retours")
    .select("id, prenom, created_at, page_url, page_titre, element_texte, toute_la_page, appareil, ecran_largeur, semaine, etape, types, texte, traite, note, image_path")
    .order("created_at", { ascending: false })
    .limit(1000);
  // Les images : des liens temporaires (une heure), jamais publics.
  const avecImage = (data ?? []).filter((r) => r.image_path);
  const signes = avecImage.length ? (await admin.storage.from("retours").createSignedUrls(avecImage.map((r) => r.image_path as string), 3600)).data ?? [] : [];
  const urlDe = new Map(signes.map((s) => [s.path, s.signedUrl]));
  const retours = (data ?? []).map((r) => ({ ...(r as RetourLu), image: r.image_path ? (urlDe.get(r.image_path) ?? null) : null }));

  return (
    <main className={styles.page}>
      <Link href="/equipe" className={styles.retour}>
        ← La page de l&apos;équipe
      </Link>
      <h1 className={styles.titre}>Les retours des testeuses</h1>
      {error ? (
        <p className={styles.vide}>
          La table des retours n&apos;est pas encore prête : il manque le SQL de la V0.13 dans Supabase.
        </p>
      ) : (
        <ListeRetours retours={retours} />
      )}
    </main>
  );
}
