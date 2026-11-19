import Link from "next/link";
import { Marque } from "./Marque";
import styles from "./BarreEspace.module.css";

type Page = "chemin" | "carnet" | "carte" | null;

/** La barre du haut de « Mon espace » : fixe, sur le chemin, les semaines et le carnet. */
export function BarreEspace({ courante = null }: { courante?: Page }) {
  const lien = (page: Exclude<Page, null>, href: string, label: string) => (
    <Link href={href} aria-current={courante === page ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className={styles.barre}>
      <Link href="/chemin" className={styles.marque} aria-label="Mon chemin">
        <Marque couleur="rouge" />
      </Link>
      <nav className={styles.nav} aria-label="Mon espace">
        {lien("chemin", "/chemin", "Mon chemin")}
        {lien("carnet", "/carnet", "Mon carnet")}
        {lien("carte", "/carte", "Ma carte")}
      </nav>
    </header>
  );
}
