/**
 * Affiche un texte en mettant ses mots à elle (entre guillemets français) en valeur :
 * italique semi-gras, bordeaux, sur un surlignage rose.
 */
export function AvecSesMots({ texte, fond = "rose" }: { texte: string; fond?: "rose" | "blanc" }) {
  const morceaux = texte.split(/(«[^»]*»)/g);
  return (
    <>
      {morceaux.map((m, i) =>
        m.startsWith("«") ? (
          <span key={i} className={fond === "blanc" ? "ses-mots ses-mots--blanc" : "ses-mots"}>
            {m}
          </span>
        ) : (
          m
        ),
      )}
    </>
  );
}
