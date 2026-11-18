# Présente!

L'école de Liberté, Chérie !. Démo V0.

Tout commence par [BRIEF.md](BRIEF.md). Les réglages Supabase et Vercel sont dans [docs/mise-en-route.md](docs/mise-en-route.md).

## Ce qui est en place

- Étapes 2 à 4 : questionnaire en 5 parties avec sauvegarde automatique et reprise, calcul du chemin (`lib/chemin/calcul.ts`, testé), carte, échange d'une quête, chemin semaine par semaine, humeur du jour, bouton de test « semaine suivante ».
- Étape 1 : projet Next.js (App Router, TypeScript), schéma Supabase avec RLS (`supabase/migrations/`), connexion par lien magique, liste blanche (`ALLOWED_EMAILS`), page de confidentialité.

## Commandes

```bash
npm install
npm run dev     # site en local sur http://localhost:3000
npm test        # tests
npm run build   # vérifie que tout compile
```
