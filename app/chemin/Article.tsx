import type { Article as ArticleDuJour } from "@/lib/rituel/airtable";
import styles from "./espace.module.css";

/** À lire aujourd'hui : l'article validé du jour, avec « Notre regard ». */
export function Article({ article }: { article: ArticleDuJour }) {
  return (
    <section className={`${styles.bloc} ${styles.article}`} aria-labelledby="article-titre">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.image ?? "/images/conversation.jpg"} alt="" className={styles.articleImage} />
      <div className={styles.articleTexte}>
        <span className={styles.articleSource}>À lire aujourd&apos;hui{article.source ? ` · ${article.source}` : ""}</span>
        <span id="article-titre" className={styles.articleTitre}>
          {article.titre}
        </span>
        {article.regard ? <span className={styles.articleRegard}>{article.regard}</span> : null}
        <a href={article.lien} target="_blank" rel="noopener noreferrer" className={styles.articleLien}>
          Lire l&apos;article<span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
        </a>
      </div>
    </section>
  );
}
