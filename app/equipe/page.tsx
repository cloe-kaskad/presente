import { notFound } from "next/navigation";
import { chargerCatalogue } from "@/lib/catalogue/airtable";
import { estEquipe } from "@/lib/equipe";
import { avisParContenu, dansLesSemaines, decrochage, entonnoir, rituel, rythme, type Evenement } from "@/lib/mesure/statistiques";
import { MODE_TEST, SEUIL_CONFIDENTIALITE } from "@/lib/mode-test";
import { jourAParis } from "@/lib/rituel/citations";
import { EPISODES } from "@/lib/semaines/contenu";
import { RETOURS } from "@/lib/semaines/etiquettes";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { MondeId } from "@/lib/questionnaire/contenu";
import styles from "./equipe.module.css";

export const metadata = { title: "Équipe · Présente !", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * La page de l'équipe (brief V0.10) : où les femmes avancent, où elles s'arrêtent. Uniquement des totaux,
 * jamais de nom, d'adresse ni de lien vers un compte. Réservée aux adresses de EQUIPE_EMAILS (sinon : 404).
 */
export default async function Equipe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estEquipe(user.email)) notFound();

  // Lecture d'ensemble par le serveur seulement (clé administrateur), jamais depuis le navigateur.
  const admin = createAdminClient();
  const [{ data: lignes, error }, { data: chemins }, { catalogue }] = await Promise.all([
    admin.from("evenements").select("user_id, type, semaine, cle, jour, created_at").order("created_at", { ascending: true }).limit(50000),
    admin.from("paths").select("user_id, choix, mondes").eq("actif", true),
    chargerCatalogue(),
  ]);
  // Le jour au format AAAA-MM-JJ, quelle que soit la façon dont la base le renvoie.
  const evs = ((lignes ?? []) as Evenement[]).map((e) => ({ ...e, jour: String(e.jour).slice(0, 10) }));
  const aujourdhui = jourAParis();

  const titres = new Map(catalogue.contenus.map((c) => [c.id, c.titre]));
  const cheminDe = new Map((chemins ?? []).map((c) => [c.user_id as string, c as { choix: Record<string, { contenu?: string | null }>; mondes: MondeId[] }]));
  const contenuDe = (userId: string, n: number) => {
    const c = cheminDe.get(userId);
    if (!c) return null;
    const mois = Math.floor((n - 1) / 4);
    const d = ((n - 1) % 4) + 1;
    if (d === 2 || d === 4) return EPISODES[c.mondes?.[mois]]?.[d === 2 ? 0 : 1]?.titre ?? null;
    const id = c.choix?.[`m${mois + 1}s${d}`]?.contenu;
    return id ? (titres.get(id) ?? null) : null;
  };

  const ent = entonnoir(evs);
  const semaines = dansLesSemaines(evs);
  const dec = decrochage(evs, aujourdhui);
  const ry = rythme(evs, aujourdhui);
  const ri = rituel(evs);
  const avis = avisParContenu(evs, contenuDe);
  const max = Math.max(1, ...ent.map((l) => l.nombre));

  // Après le lancement : pas de chiffre sur moins de 5 personnes.
  const n = (x: number) => (MODE_TEST || x === 0 || x >= SEUIL_CONFIDENTIALITE ? String(x) : `moins de ${SEUIL_CONFIDENTIALITE}`);
  const pct = (x: number | null) => (x === null ? "–" : `${x} %`);

  return (
    <main className={styles.page}>
      <header className={styles.tete}>
        <h1 className={styles.titre}>L&apos;engagement</h1>
        {MODE_TEST ? <span className={styles.test}>Phase de test : chiffres affichés même sous 5 personnes.</span> : null}
        <p className={styles.intro}>
          Uniquement des totaux, calculés à partir des étapes franchies. Jamais ce qu&apos;elles écrivent, jamais de nom.
          {error ? " La table des étapes n'est pas encore créée dans Supabase." : ""}
        </p>
      </header>

      <section className={styles.bloc} aria-labelledby="entonnoir">
        <h2 id="entonnoir">L&apos;entonnoir</h2>
        <ol className={styles.entonnoir}>
          {ent.map((l) => (
            <li key={l.libelle}>
              <span className={styles.libelle}>{l.libelle}</span>
              <span className={styles.barre} aria-hidden="true">
                <i style={{ width: `${(100 * l.nombre) / max}%` }} />
              </span>
              <span className={styles.nombre}>{n(l.nombre)}</span>
              <span className={styles.part}>{l.part === null ? "" : `${l.part} %`}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.bloc} aria-labelledby="semaines">
        <h2 id="semaines">Dans une semaine</h2>
        {semaines.length ? (
          <div className={styles.tableau}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Semaine</th>
                  <th scope="col">L&apos;ont ouverte</th>
                  <th scope="col">Ont écouté</th>
                  <th scope="col">Carnet écrit</th>
                  <th scope="col">Exercice créé</th>
                  <th scope="col">Exercice terminé</th>
                  <th scope="col">Tirer le fil</th>
                </tr>
              </thead>
              <tbody>
                {semaines.map((s) => (
                  <tr key={s.semaine}>
                    <th scope="row">{s.semaine}</th>
                    {[s.ouverte, s.ecoute, s.carnet, s.exerciceCree, s.exerciceTermine, s.fil].map((x, i) => (
                      <td key={i}>{n(x)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.vide}>Pas encore de semaine ouverte.</p>
        )}
      </section>

      <div className={styles.deux}>
        <section className={styles.bloc} aria-labelledby="decrochage">
          <h2 id="decrochage">Le décrochage</h2>
          <dl className={styles.chiffres}>
            <div>
              <dt>Rien fait depuis 7 jours</dt>
              <dd>
                {n(dec.sept)} <span>sur {n(dec.total)}</span>
              </dd>
            </div>
            <div>
              <dt>Rien fait depuis 14 jours</dt>
              <dd>
                {n(dec.quatorze)} <span>sur {n(dec.total)}</span>
              </dd>
            </div>
          </dl>
          {dec.ouEllesEnEtaient.length ? (
            <p className={styles.detail}>
              Où elles en étaient :{" "}
              {dec.ouEllesEnEtaient.map((o) => `${o.semaine ? `semaine ${o.semaine}` : "avant la semaine 1"} (${n(o.nombre)})`).join(", ")}.
            </p>
          ) : null}
        </section>

        <section className={styles.bloc} aria-labelledby="rythme">
          <h2 id="rythme">Le rythme</h2>
          <dl className={styles.chiffres}>
            <div>
              <dt>Jours entre deux semaines (médiane)</dt>
              <dd>{ry.joursEntreDeuxSemaines ?? "–"}</dd>
            </div>
            <div>
              <dt>Jours de visite sur les 7 derniers (moyenne)</dt>
              <dd>{ry.visitesSur7Jours ?? "–"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className={styles.bloc} aria-labelledby="rituel">
        <h2 id="rituel">Le rituel</h2>
        <p className={styles.detail}>Sur {n(ri.joursDeVisite)} jours de visite :</p>
        <dl className={styles.chiffres}>
          <div>
            <dt>Humeur notée</dt>
            <dd>{pct(ri.humeur)}</dd>
          </div>
          <div>
            <dt>Question Chérie répondue</dt>
            <dd>{pct(ri.questionCherie)}</dd>
          </div>
          <div>
            <dt>Article ouvert</dt>
            <dd>{pct(ri.article)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.bloc} aria-labelledby="avis">
        <h2 id="avis">Les avis par contenu</h2>
        {avis.length ? (
          <div className={styles.tableau}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Contenu</th>
                  {RETOURS.map((r) => (
                    <th key={r.id} scope="col">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {avis.map((a) => (
                  <tr key={a.titre}>
                    <th scope="row">{a.titre}</th>
                    {RETOURS.map((r) => (
                      <td key={r.id}>{a.choix[r.id] ? n(a.choix[r.id]) : "·"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.vide}>Pas encore d&apos;avis.</p>
        )}
      </section>
    </main>
  );
}
