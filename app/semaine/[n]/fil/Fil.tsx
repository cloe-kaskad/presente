"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChampCarnet } from "@/components/ChampCarnet";
import m from "@/components/mouvement.module.css";
import type { Fil as DonneesFil } from "@/lib/catalogue/fil";
import { marquerFilLu } from "../../actions";
import styles from "./fil.module.css";

const FOND: Record<string, string> = { idee: styles.rose, chiffre: styles.blanc, regard: styles.bleu, echo: styles.blanc };

/** « Tirer le fil » (maquettes Dossier et D-Dossier, V0.9) : une idée, un chiffre, un regard, un écho. */
export function Fil({ n, surtitre, fil, garde, luLe }: { n: number; surtitre: string; fil: DonneesFil; garde: string; luLe: number | null }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  return (
    <main className={styles.page}>
      <div className={styles.tete}>
        <Link href="/chemin" className={styles.retour}>
          ← Mon chemin
        </Link>
        <span className={styles.surtitre}>{surtitre}</span>
        <h1 className={styles.titre}>{fil.titre}</h1>
        {fil.chapo ? <p className={styles.chapo}>{fil.chapo}</p> : null}
      </div>

      <div className={styles.blocs}>
        {fil.blocs.map((b, i) => (
          <section key={b.cle} className={`${styles.bloc} ${FOND[b.cle]} ${m.monte}`} style={{ animationDelay: `${0.1 + i * 0.09}s` }} aria-labelledby={`fil-${b.cle}`}>
            <span className={styles.etiquette}>{b.etiquette}</span>
            {b.titre ? (
              <h2 id={`fil-${b.cle}`} className={styles.blocTitre}>
                {b.titre}
              </h2>
            ) : null}
            {b.texte ? <p className={styles.texte}>{b.texte}</p> : null}
            {b.source ? (
              b.lien ? (
                <a href={b.lien} target="_blank" rel="noopener noreferrer" className={styles.source}>
                  {b.source}
                  <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              ) : (
                <span className={styles.source}>{b.source}</span>
              )
            ) : null}
          </section>
        ))}
      </div>

      <section className={styles.fin} aria-label="Ce que tu en gardes">
        <ChampCarnet
          semaine={n}
          type="carnet"
          code={`s${n}:fil`}
          question="Ce que tu en gardes, en une ligne."
          libelle="Ce que tu en gardes, en une ligne. (facultatif)"
          placeholder="Ça ira dans ton carnet."
          initial={garde}
          ligne
        />
        <div className={styles.actions}>
          <button
            type="button"
            className="bouton"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                await marquerFilLu(n).catch(() => null);
                router.push("/chemin");
              })
            }
          >
            {luLe ? "C'est lu, retour à mon chemin" : "C'est lu"}
          </button>
          <span className={styles.aide}>Tu pourras y revenir depuis ton chemin.</span>
        </div>
      </section>
    </main>
  );
}
