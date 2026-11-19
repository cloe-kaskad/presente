/**
 * Le chemin du mois qui se dessine : un tracé en S, un point par étape (huit).
 * Les étapes faites sont pleines, l'étape en cours plus grosse, la suite en pointillé.
 */
const W = 360;
const H = 150;
const P0 = [8, 136];
const P1 = [150, 134];
const P2 = [210, 40];
const P3 = [352, 10];

function bezier(t: number): [number, number] {
  const u = 1 - t;
  const x = u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0];
  const y = u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1];
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/** Le morceau de courbe entre t0 et t1, en segments courts (assez lisse à cette taille). */
function morceau(t0: number, t1: number): string {
  const pas = 24;
  const pts = Array.from({ length: pas + 1 }, (_, i) => bezier(t0 + ((t1 - t0) * i) / pas));
  return pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
}

export function TraceDuMois({ faites, total = 8, label }: { faites: number; total?: number; label: string }) {
  const ts = Array.from({ length: total }, (_, i) => i / (total - 1));
  const tCourant = ts[Math.min(Math.max(faites - 1, 0), total - 1)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ display: "block", overflow: "visible", width: "100%", maxWidth: W, height: "auto" }}>
      {faites > 0 ? <path d={morceau(0, tCourant)} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" /> : null}
      {faites < total ? (
        <path d={morceau(tCourant, 1)} fill="none" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 6" strokeLinecap="round" opacity=".75" />
      ) : null}
      {ts.map((t, i) => {
        const [x, y] = bezier(t);
        const fait = i < faites;
        const courant = i === faites - 1;
        return fait ? (
          <circle key={i} cx={x} cy={y} r={courant ? 8 : 5} fill="#ffffff" />
        ) : (
          <circle key={i} cx={x} cy={y} r={i === total - 1 ? 6 : 5} fill="none" stroke="#ffffff" strokeWidth="1.8" opacity=".8" />
        );
      })}
    </svg>
  );
}
