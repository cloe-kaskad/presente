import Link from "next/link";
import styles from "./detresse.module.css";

export const metadata = { title: "Quand ça ne va pas · Présente !" };

export default function QuandCaNeVaPas() {
  return (
    <main className={styles.page}>
      <span className={`titre-nom ${styles.marque}`}>Présente&nbsp;!</span>
      <h1 className={styles.titre}>Ce que tu écris compte. Tu n&apos;as pas à porter ça seule.</h1>
      <p className={styles.texte}>
        Si tu traverses un moment très difficile, des personnes formées peuvent t&apos;écouter, maintenant.
      </p>
      <a href="tel:3114" className={`${styles.carte} ${styles.cartePleine}`}>
        <span className={`titre-nom ${styles.numero}`}>3114</span>
        <span>Numéro national de prévention du suicide. Gratuit, 24 heures sur 24, 7 jours sur 7.</span>
      </a>
      <a href="tel:15" className={styles.carte}>
        <span className={`titre-nom ${styles.numero} ${styles.numeroPetit}`}>15 ou 112</span>
        <span>En cas d&apos;urgence.</span>
      </a>
      <p className={styles.texte}>Tu peux aussi en parler à ton médecin, ou à une personne de confiance.</p>
      <p className={styles.attend}>Ton chemin t&apos;attend. Il n&apos;y a aucune urgence.</p>
      <Link href="/" className={`bouton ${styles.revenir}`}>
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
