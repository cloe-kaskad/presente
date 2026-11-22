/**
 * Les étapes d'une semaine, avec leur état, pour la carte « Cette semaine » de Mon chemin (brief V0.9).
 * Semaine de quête : le contenu, le carnet, l'exercice (ou le geste), et « Tirer le fil » quand il y en a un de validé.
 * Semaine de monde : l'épisode, les questions d'après, et le palier en semaine 4.
 */
import { jourAParis } from "@/lib/rituel/citations";
import type { ExerciceDuChemin } from "./exercice";

export type EtatEtape = "faite" | "en_cours" | "a_faire";
export type EtapeSemaine = {
  cle: string;
  libelle: string;
  etat: EtatEtape;
  /** À droite : quand (« lundi »), combien (« 2 notes »), où elle en est, ou la durée. */
  droite: string;
  href: string;
  /** Le libellé du bouton quand c'est la prochaine chose à faire. */
  action: string;
  /** Rien à faire aujourd'hui sur cette étape (exercice sur plusieurs jours, jour déjà noté). */
  aJour?: boolean;
};

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const jourDeLaSemaine = (secondes: number) => {
  const [a, m, j] = jourAParis(new Date(secondes * 1000)).split("-").map(Number);
  return JOURS[new Date(Date.UTC(a, m - 1, j, 12)).getUTCDay()];
};
const notes = (k: number) => `${k} note${k > 1 ? "s" : ""}`;

const NATURE: Record<string, { nom: string; fait: string; verbe: string }> = {
  podcast: { nom: "Le podcast", fait: "Podcast écouté", verbe: "Écouter le podcast" },
  livre: { nom: "Le livre", fait: "Livre lu", verbe: "Lire le livre" },
  roman: { nom: "Le roman", fait: "Roman lu", verbe: "Lire le roman" },
  bd: { nom: "La BD", fait: "BD lue", verbe: "Lire la BD" },
  texte: { nom: "Le texte", fait: "Texte lu", verbe: "Lire le texte" },
  video: { nom: "La vidéo", fait: "Vidéo regardée", verbe: "Regarder la vidéo" },
  film: { nom: "Le film", fait: "Film regardé", verbe: "Regarder le film" },
  documentaire: { nom: "Le documentaire", fait: "Documentaire regardé", verbe: "Regarder le documentaire" },
};
const sans = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function nature(c: { type: string; format: string | null } | null) {
  const n = c ? NATURE[sans(c.type)] : undefined;
  if (n) return n;
  if (c?.format === "lire") return { nom: "La lecture", fait: "Lecture faite", verbe: "Lire" };
  if (c?.format === "regarder") return { nom: "La vidéo", fait: "Vidéo regardée", verbe: "Regarder" };
  return { nom: "Le contenu", fait: "Contenu écouté", verbe: "Écouter le contenu" };
}
const DUREE: Record<string, string> = { court: "20 à 30 min", moyen: "30 min à 1 h", long: "plus d'une heure" };

export function etapesDeLaSemaine(args: {
  n: number;
  progression: Record<string, number>;
  entrees: { code: string; reponse: string; retour?: string | null }[];
  contenu: { type: string; format: string | null; temps: string | null } | null;
  exercice: ExerciceDuChemin | null;
  /** Le nom et le rythme de la pratique, quand l'exercice n'est pas encore créé. */
  pratique: { nom: string; rythme: string | null } | null;
  ecoute: number | null;
  /** « Tirer le fil » validé pour cette semaine, et quand elle l'a lu ; null : l'étape n'apparaît pas. */
  fil?: { lu: number | null } | null;
}): EtapeSemaine[] {
  const { n, progression, entrees, contenu, exercice, pratique, ecoute, fil } = args;
  const d = ((n - 1) % 4) + 1;
  const page = `/semaine/${n}`;
  const ecrites = (filtre: (code: string) => boolean) => entrees.filter((e) => filtre(e.code) && e.reponse.trim()).length;

  if (d === 2 || d === 4) {
    const questions = ecrites((c) => c.startsWith(`s${n}:`) && !c.startsWith(`s${n}:avant`) && !c.startsWith(`s${n}:palier`) && c !== `s${n}:retour`);
    const etapes: EtapeSemaine[] = [
      {
        cle: "episode",
        libelle: ecoute ? "Épisode écouté" : "L'épisode",
        etat: ecoute ? "faite" : "a_faire",
        droite: ecoute ? jourDeLaSemaine(ecoute) : "25 min",
        href: page,
        action: "Écouter l'épisode",
      },
      {
        cle: "questions",
        libelle: "Les questions d'après",
        etat: questions || (progression[String(n)] ?? 0) >= 3 ? "faite" : "a_faire",
        droite: questions ? notes(questions) : "5 min",
        href: page,
        action: "Répondre aux questions",
      },
    ];
    if (d === 4) {
      const fait = (progression[String(n)] ?? 0) >= 4;
      etapes.push({ cle: "palier", libelle: "Le palier", etat: fait ? "faite" : "a_faire", droite: fait ? "fait" : "5 min", href: page, action: "Vers le palier" });
    }
    return etapes;
  }

  const nat = nature(contenu);
  const carnet = ecrites((c) => c.startsWith(`s${n}:carnet:`));
  const etapes: EtapeSemaine[] = [
    {
      cle: "contenu",
      libelle: ecoute ? nat.fait : nat.nom,
      etat: ecoute ? "faite" : "a_faire",
      droite: ecoute ? jourDeLaSemaine(ecoute) : DUREE[contenu?.temps ?? ""] ?? "",
      href: `${page}#contenu`,
      action: nat.verbe,
    },
    {
      cle: "carnet",
      libelle: "Ton carnet",
      etat: carnet ? "faite" : "a_faire",
      droite: carnet ? notes(carnet) : "2 min",
      href: `${page}#carnet`,
      action: "Écrire dans mon carnet",
    },
  ];
  const nom = d === 3 ? "Ton geste" : "Ton exercice";
  const quoi = d === 3 ? "mon geste" : "mon exercice";
  if (exercice) {
    const etat: EtatEtape = exercice.etat === "termine" ? "faite" : exercice.etat === "en_cours" ? "en_cours" : "a_faire";
    etapes.push({
      cle: "exercice",
      libelle: nom,
      etat,
      droite:
        exercice.etat === "termine"
          ? "terminé"
          : exercice.etat === "pas_commence"
            ? (exercice.rythme ?? "").toLowerCase()
            : exercice.jour && exercice.total
              ? `jour ${exercice.jour} sur ${exercice.total}`
              : "en cours",
      href: `${page}/exercice`,
      action: exercice.etat === "pas_commence" ? `Commencer ${quoi}` : `Reprendre ${quoi}`,
      aJour: exercice.etat === "en_cours" && Boolean(exercice.total) && exercice.aujourdhuiNote,
    });
  } else if (pratique) {
    etapes.push({ cle: "exercice", libelle: nom, etat: "a_faire", droite: (pratique.rythme ?? "").toLowerCase(), href: `${page}#carnet`, action: `Ouvrir ${quoi}` });
  }
  if (fil) {
    etapes.push({
      cle: "fil",
      libelle: "Tirer le fil",
      etat: fil.lu ? "faite" : "a_faire",
      droite: fil.lu ? jourDeLaSemaine(fil.lu) : "5 min de lecture",
      href: `${page}/fil`,
      action: "Tirer le fil",
    });
  }
  return etapes;
}

/** La prochaine chose à faire : la première étape ni faite, ni à jour pour aujourd'hui. */
export function prochaineEtape(etapes: EtapeSemaine[]): EtapeSemaine | null {
  return etapes.find((e) => e.etat !== "faite" && !e.aJour) ?? null;
}
