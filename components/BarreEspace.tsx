import Link from "next/link";
import { Marque } from "./Marque";
import styles from "./BarreEspace.module.css";

type Page = "chemin" | "journal" | "carnet" | "carte" | null;

const LIENS: { page: Exclude<Page, null>; href: string; long: string; court: string }[] = [
  { page: "chemin", href: "/chemin", long: "Mon chemin", court: "Chemin" },
  { page: "journal", href: "/journal", long: "Mon journal", court: "Journal" },
  { page: "carnet", href: "/carnet", long: "Mon carnet", court: "Carnet" },
  { page: "carte", href: "/carte", long: "Ma carte", court: "Carte" },
];

/** La barre blanche fixe de « Mon espace » (maquettes Chemin et D-Chemin). */
export function BarreEspace({ courante = null }: { courante?: Page }) {
  return (
    <header className={styles.barre}>
      <Link href="/chemin" className={styles.marque} aria-label="Mon chemin">
        <Marque couleur="rouge" />
      </Link>
      <nav className={styles.nav} aria-label="Mon espace">
        {LIENS.map((l) => (
          <Link
            key={l.page}
            href={l.href}
            aria-label={l.long}
            aria-current={courante === l.page ? "page" : undefined}
            className={l.page === "carte" ? styles.carte : undefined}
          >
            <span className={styles.long}>{l.long}</span>
            <span className={styles.court} aria-hidden="true">
              {l.court}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
