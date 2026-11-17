/**
 * La forme des réponses, partie par partie, et leur validation.
 * Chaque partie est stockée en jsonb dans questionnaire_responses.
 */
import { z } from "zod";
import { PHRASES_ZOOM } from "./capacites";
import { FIL_ROUGE, FORMATS, QUESTIONS_OUVERTES, QUETES, TEMPS, type QueteId, codesDe } from "./contenu";

const TEXTE_MAX = 5000;
const texte = z.string().max(TEXTE_MAX);
const curseur = z.number().int().min(1).max(5);

export const Partie1 = z.object(
  Object.fromEntries(QUESTIONS_OUVERTES.map((q) => [q.id, texte.optional()])) as Record<
    (typeof QUESTIONS_OUVERTES)[number]["id"],
    z.ZodOptional<z.ZodString>
  >,
);
export type Partie1 = z.infer<typeof Partie1>;

const PositionQuete = z.object({ ou: curseur.optional(), envie: curseur.optional() });
export const Partie2 = z.object({
  quetes: z.partialRecord(z.enum(QUETES), PositionQuete).default({}),
  appelle: texte.optional(),
});
export type Partie2 = z.infer<typeof Partie2>;

const codesCapacite = Object.keys(PHRASES_ZOOM) as [string, ...string[]];
const ZoomQuete = z.object({
  choisies: z.array(z.enum(codesCapacite)).max(2).default([]),
  intensite: z.partialRecord(z.enum(codesCapacite), curseur).default({}),
  autrement: texte.optional(),
});
export const Partie3 = z
  .object({ zoom: z.partialRecord(z.enum(QUETES), ZoomQuete).default({}) })
  .superRefine((v, ctx) => {
    for (const [q, z3] of Object.entries(v.zoom)) {
      const permis = codesDe(q as QueteId) as string[];
      for (const c of z3?.choisies ?? []) {
        if (!permis.includes(c)) ctx.addIssue({ code: "custom", message: `${c} n'appartient pas à ${q}` });
      }
    }
  });
export type Partie3 = z.infer<typeof Partie3>;

const codesFR = FIL_ROUGE.map((f) => f.code) as [string, ...string[]];
export const Partie4 = z.object({
  filRouge: z.partialRecord(z.enum(codesFR), curseur).default({}),
  pasEncore: texte.optional(),
});
export type Partie4 = z.infer<typeof Partie4>;

export const Partie5 = z.object({
  temps: z.enum(TEMPS.map((t) => t.id) as [string, ...string[]]).optional(),
  formats: z
    .array(z.enum(FORMATS.map((f) => f.id) as [string, ...string[]]))
    .max(2)
    .default([]),
  sujets: texte.optional(),
  inspiration: texte.optional(),
  prenom: z.string().trim().max(60).optional(),
  age: z.number().int().min(12).max(120).optional(),
  codePostal: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z -]{0,10}$/)
    .optional(),
});
export type Partie5 = z.infer<typeof Partie5>;

export const SCHEMAS = { 1: Partie1, 2: Partie2, 3: Partie3, 4: Partie4, 5: Partie5 } as const;
export type NumeroPartie = keyof typeof SCHEMAS;

export type Reponses = {
  1: Partie1;
  2: Partie2;
  3: Partie3;
  4: Partie4;
  5: Partie5;
};

export function reponsesVides(): Reponses {
  return {
    1: {},
    2: { quetes: {} },
    3: { zoom: {} },
    4: { filRouge: {} },
    5: { formats: [] },
  };
}

/** Lit ce qui vient de la base : ce qui ne passe pas la validation est ignoré, jamais bloquant. */
export function lirePartie<N extends NumeroPartie>(n: N, brut: unknown): Reponses[N] {
  const r = SCHEMAS[n].safeParse(brut ?? {});
  return (r.success ? r.data : reponsesVides()[n]) as Reponses[N];
}
