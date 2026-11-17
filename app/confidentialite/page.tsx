import Link from "next/link";
import { Marque } from "@/components/Marque";
import styles from "../connexion/page.module.css";

export const metadata = { title: "Confidentialité · Présente !" };

export default function Confidentialite() {
  return (
    <div className={styles.page}>
      <header className={styles.entete}>
        <Link href="/" aria-label="Retour à l'accueil">
          <Marque />
        </Link>
      </header>
      <main className={styles.corps}>
        <h1 className={styles.titre}>Ce qu&apos;on fait de tes réponses.</h1>
        <p className={styles.intro}>
          Présente! est en démo privée. Voici, en clair, ce qui arrive à ce que tu écris.
        </p>

        <h2>Personne ne lit tes réponses</h2>
        <p>
          Ni Liberté, Chérie !, ni l&apos;équipe de Présente!. Il n&apos;existe aucune page qui permette
          de les consulter. Chaque compte ne voit que ses propres réponses : c&apos;est verrouillé dans
          la base de données elle-même.
        </p>

        <h2>À quoi elles servent</h2>
        <p>
          Uniquement à composer ton chemin : choisir tes quêtes, et écrire pour toi les quelques
          lignes qui accompagnent chaque semaine.
        </p>

        <h2>Un outil d&apos;IA les lit</h2>
        <p>
          Ces textes sont écrits par Claude, un outil d&apos;intelligence artificielle de la société
          Anthropic. Pour écrire, il reçoit les réponses utiles au texte demandé. Ses serveurs sont
          aux États-Unis. Anthropic n&apos;utilise pas ces échanges pour entraîner ses modèles.
        </p>

        <h2>Où elles sont stockées</h2>
        <p>
          Dans une base de données Supabase, hébergée dans l&apos;Union européenne. Le site tourne sur
          Vercel, avec des serveurs à Paris.
        </p>

        <h2>Ce que Présente! n&apos;est pas</h2>
        <p>
          Présente! n&apos;est pas un suivi psychologique. Si ça ne va pas du tout, appelle le 3114
          (gratuit, jour et nuit), ton médecin, ou une personne de confiance.
        </p>

        <h2>Tes droits</h2>
        <p>
          Tu peux demander à tout moment que ton compte et toutes tes réponses soient effacés. Il
          suffit d&apos;écrire à Cloé.
        </p>

        <p className={styles.petit}>
          <Link href="/">Retour à l&apos;accueil</Link>
        </p>
      </main>
    </div>
  );
}
