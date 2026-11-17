import Link from "next/link";
import { Marque } from "@/components/Marque";
import styles from "./page.module.css";

export default function Accueil() {
  return (
    <main className={styles.hero}>
      <div className={styles.haut}>
        <Marque />
        <Link href="/connexion" className="bouton bouton--contour-blanc">
          Se connecter
        </Link>
      </div>
      <div className={styles.texte}>
        <p className={styles.avant}>Personne ne peut faire le chemin à ta place.</p>
        <h1 className={styles.titre}>Mais on peut t&apos;aider à le tracer.</h1>
        <div className={styles.appel}>
          <Link href="/connexion" className="bouton bouton--blanc bouton--grand">
            Commencer le questionnaire
          </Link>
          <span>
            Un quart d&apos;heure.
            <br />
            Tu peux t&apos;arrêter et reprendre.
          </span>
        </div>
      </div>
      <p className={styles.pied}>
        <Link href="/confidentialite">Confidentialité</Link>
      </p>
    </main>
  );
}
