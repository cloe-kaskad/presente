import Link from "next/link";
import m from "@/components/mouvement.module.css";
import type { EtapeSemaine } from "@/lib/semaines/etapes-semaine";
import styles from "./semaine.module.css";

export type AutreSemaine = { n: number; etiquette: string; titre: string; etat: "faite" | "a_reprendre" | "avenir"; arrive?: string | null };

/** L'icône d'une étape : rond blanc avec coche (faite), arc (en cours), pointillés (à faire). */
function Rond({ etat, clair = false }: { etat: "faite" | "en_cours" | "a_faire" | "avenir" | "a_reprendre"; clair?: boolean }) {
  const classe =
    etat === "faite" ? styles.rondFait : etat === "en_cours" || etat === "a_reprendre" ? styles.rondEnCours : styles.rondAFaire;
  return (
    <i className={`${styles.rond} ${classe} ${clair ? styles.surClair : ""}`} aria-hidden="true">
      {etat === "faite" ? "✓" : ""}
    </i>
  );
}

const ETAT_LU: Record<string, string> = { faite: "fait", en_cours: "en cours", a_faire: "à faire" };

/**
 * « Ton chemin, cette semaine. » (maquettes Chemin et D-Chemin, V0.9) : la grande carte de la semaine avec ses étapes,
 * la prochaine chose à faire et la date de la suite ; à droite, la semaine suivante et les semaines faites.
 */
export function CetteSemaine({
  n,
  etiquette,
  titre,
  etapes,
  prochaine,
  arrive,
  exerciceEnCours,
  allege,
  autres,
}: {
  n: number;
  etiquette: string;
  titre: string;
  etapes: EtapeSemaine[];
  prochaine: EtapeSemaine | null;
  /** « lundi 23 novembre », ou null si la semaine n'a pas encore été ouverte. */
  arrive: string | null;
  exerciceEnCours: boolean;
  allege: string | null;
  autres: AutreSemaine[];
}) {
  const suivante = autres.find((a) => a.etat === "avenir");
  const passees = autres.filter((a) => a.etat !== "avenir");
  const ligne = (a: AutreSemaine, i: number) => {
    const contenu = (
      <>
        <Rond etat={a.etat === "faite" ? "faite" : a.etat} clair />
        <span className={styles.autreTexte}>
          <span className={styles.autreEtiquette}>
            {a.etiquette} · {a.etat === "faite" ? "faite" : a.etat === "a_reprendre" ? "à reprendre" : a.arrive ? `arrive ${a.arrive}` : "à venir"}
          </span>
          <span className={styles.autreTitre}>{a.titre}</span>
        </span>
      </>
    );
    const classe = `${styles.autre} ${a.etat === "avenir" ? styles.autreAvenir : ""} ${m.monte}`;
    const delai = { animationDelay: `${0.48 + i * 0.09}s` };
    return a.etat === "avenir" ? (
      <div key={a.n} className={classe} style={delai}>
        {contenu}
      </div>
    ) : (
      <Link key={a.n} href={`/semaine/${a.n}`} className={classe} style={delai}>
        {contenu}
      </Link>
    );
  };

  return (
    <div className={styles.grille}>
      <div className={`${styles.carte} ${m.monte}`} style={{ animationDelay: "0.39s" }}>
        <span className={styles.etiquette}>{etiquette}</span>
        <Link href={`/semaine/${n}`} className={styles.titre}>
          {titre}
        </Link>
        {allege ? <span className={styles.allege}>{allege}</span> : null}
        <ol className={styles.etapes}>
          {etapes.map((e) => (
            <li key={e.cle}>
              <Link href={e.href} className={`${styles.etape} ${e.etat === "faite" ? styles.etapeFaite : ""}`}>
                <Rond etat={e.etat} />
                <span className={styles.etapeNom}>
                  {e.libelle}
                  <span className="sr-only"> ({ETAT_LU[e.etat]})</span>
                </span>
                <span className={styles.etapeDroite}>{e.droite}</span>
              </Link>
            </li>
          ))}
        </ol>
        <div className={styles.bas}>
          {prochaine ? (
            <Link href={prochaine.href} className={styles.bouton}>
              {prochaine.action}
            </Link>
          ) : null}
          <span className={styles.suite}>
            {prochaine ? (
              arrive ? (
                <>
                  Ta prochaine étape arrive <strong>{arrive}</strong>.
                </>
              ) : (
                "Ta prochaine étape arrive 7 jours après ton premier passage dans cette semaine."
              )
            ) : arrive ? (
              <>
                Tu es à jour. D&apos;ici <strong>{arrive}</strong> : {exerciceEnCours ? "ton exercice et ton rituel du jour" : "ton rituel du jour"}.
              </>
            ) : (
              "Tu es à jour."
            )}
          </span>
        </div>
      </div>

      <div className={styles.colonne}>
        {suivante ? ligne(suivante, 0) : null}
        {/* Ordinateur : toutes les semaines passées ; téléphone : repliées derrière un lien */}
        <div className={styles.passeesOrdi}>{passees.map((a, i) => ligne(a, i + 1))}</div>
        {passees.length ? (
          <details className={styles.passeesTel}>
            <summary>
              Voir les semaines {passees.every((a) => a.etat === "faite") ? "faites" : "passées"} ({passees.length})
            </summary>
            <div className={`${styles.passeesListe} ${m.deplie}`}>{passees.map((a, i) => ligne(a, i + 1))}</div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
