/** « Présente ! » + « l'école de Liberté, Chérie ! » */
export function Marque({ couleur = "blanc" }: { couleur?: "blanc" | "rouge" }) {
  const blanc = couleur === "blanc";
  return (
    <div className="marque">
      <span className="titre-nom marque__nom" style={{ color: blanc ? "var(--blanc)" : "var(--rouge)" }}>
        Présente&nbsp;!
      </span>
      <span className="marque__ecole" style={{ color: blanc ? "var(--blanc)" : "var(--rouge-profond)" }}>
        <span>l&apos;école de</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-lc-rouge.png"
          alt="Liberté, Chérie !"
          style={{ height: 13, width: "auto", filter: blanc ? "brightness(0) invert(1)" : undefined }}
        />
      </span>
    </div>
  );
}
