# Mise en route

Ce qui est en place : le projet Next.js, la base de données Supabase (fichier de migration),
la connexion par lien magique et la liste blanche d'emails.

Les réglages ci-dessous se font une seule fois. Claude te les donne un par un dans la conversation.

## Supabase

1. **Créer le projet** sur supabase.com, région **Europe (Paris ou Francfort)**.
2. **Lancer le schéma** : SQL Editor > New query > coller le contenu de
   `supabase/migrations/20261117000000_schema_initial.sql` > Run.
3. **Adresse du site** : Authentication > URL Configuration.
   - Site URL : l'adresse Vercel (ex. `https://presente.vercel.app`).
   - Redirect URLs : ajouter `https://presente.vercel.app/auth/confirm` (et `http://localhost:3000/auth/confirm` pour travailler en local).
4. **Modèle de l'email** : Authentication > Emails > Magic Link. Remplacer le lien par :
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   Ainsi le lien marche même s'il est ouvert sur un autre appareil que celui où l'email a été demandé.
5. **Fermer les inscriptions libres** : Authentication > Sign In / Providers > décocher « Allow new users to sign up ».
   Les comptes sont créés par le site lui-même, seulement pour les emails de la liste blanche.
6. **Resend** comme SMTP (Authentication > Emails > SMTP Settings), pour que les emails arrivent bien.
7. **Récupérer les clés** : Project Settings > API Keys (ou API) : l'URL du projet, la clé `anon` (publique) et la clé `service_role` (secrète).

## Vercel

1. Importer le dépôt GitHub `presente` (Add New > Project). Les réglages par défaut conviennent.
2. Settings > Environment Variables : ajouter les variables listées dans `.env.example`.
   Pour l'étape 1, seules celles-ci sont nécessaires :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_EMAILS` (ex. `cloe@…,stephanie@…`, séparés par des virgules)
3. Redéployer (Deployments > ⋯ > Redeploy) pour que les variables soient prises en compte.

Les fonctions tournent à Paris (`cdg1`), réglé dans `vercel.json`.

## Vérifier

1. Ouvrir l'adresse Vercel, « Se connecter », entrer un email de la liste.
2. Ouvrir le lien reçu : on arrive sur « Tu es connectée ».
3. Essayer un email hors liste : le site répond qu'il n'est pas invité, et aucun email ne part.

## Pour les développeuses

```bash
npm install
cp .env.example .env.local   # puis remplir
npm run dev
npm test
```

## Étapes 2 à 4 : questionnaire, calcul du chemin, carte

1. **Lancer la seconde migration** : SQL Editor > New query > coller le contenu de
   `supabase/migrations/20261118000000_questionnaire_etape.sql` > Run.
   Elle ajoute de quoi reprendre le questionnaire là où on s'est arrêtée.
2. **Clé Claude** (facultative à ce stade) : dans Vercel, ajouter `ANTHROPIC_API_KEY`.
   Claude ne sert ici qu'à deux lectures : départager deux quêtes à égalité grâce à
   « Laquelle t'appelle le plus », et compléter une capacité qu'elle n'a pas cochée.
   Sans clé, une lecture simple par mots-clés prend le relais : le chemin se trace quand même.
   `CLAUDE_MODEL` est facultative (par défaut : `claude-sonnet-5-5`).
3. Redéployer.

Pour recommencer le questionnaire de zéro pendant les tests : dans Supabase, Table Editor,
supprimer sa ligne dans `paths` et ses lignes dans `questionnaire_responses`.

## Étape 5 : Airtable, choix des contenus et des exercices

1. **Lancer la migration** `supabase/migrations/20261118100000_choix_semaines.sql` (SQL Editor > Run).
2. **Vercel** : ajouter `AIRTABLE_TOKEN` (un jeton Airtable en lecture seule, accès à la base Liberté, Chérie !)
   et `AIRTABLE_BASE_ID` = `appXzGMlNyLLQeRwY`. Redéployer.

Le site lit Airtable sans jamais y écrire, avec un cache de 10 minutes : une modification dans Airtable
apparaît sur le site au plus tard 10 minutes après. Seuls les contenus et pratiques « Validé » sont proposés.
Dans la médiathèque, le site lit les champs « P! » plus le titre, l'autrice, le type, la description,
l'image et le lien (pour pouvoir afficher le contenu). Il ne lit pas « Thème LC », « Tags » ni « Recommandé par ».

## Carte V0.3 : « On trace ton chemin », nouvelle carte, « Échanger une quête »

1. **Lancer la migration** `supabase/migrations/20261118200000_textes_carte.sql` (SQL Editor > Run).
2. **Vercel** : `ANTHROPIC_API_KEY` doit être renseignée pour que le moteur écrive les textes.
   Sans clé, la carte s'affiche avec des textes de secours, sans personnalisation.

Le moteur lit ses consignes dans `prompts/moteur-ecriture.md` : on peut les modifier sans toucher au code.
Pour réécrire une carte pendant la démo : lien « Recalculer mon chemin (démo) » en bas de la carte.

## V0.4 et V0.5 : les semaines, le carnet, le rituel du jour

Deux migrations, dans cet ordre (SQL Editor > Run) :

1. `supabase/migrations/20261119000000_carnet_semaines.sql` (déjà lancée le 19 novembre).
2. `supabase/migrations/20261119100000_rituel.sql` : l'humeur avec une phrase (une par jour),
   le résumé de la semaine du journal, le choix « Recevoir La Question Chérie ».

Dans Airtable : La Question Chérie (« P! Questions chéries ») et l'article du jour (« P! À lire aujourd'hui »)
n'apparaissent que s'il y a une ligne « Validé ». Le jeton Airtable doit avoir accès à ces deux tables.

Les questions de carnet des quêtes Le Travail, Les Émotions, Le Corps et La Création sont un gabarit
provisoire (`lib/semaines/contenu.ts`), à remplacer par les vraies questions une fois écrites.
Le fichier audio des épisodes est provisoire (`public/audio/provisoire.mp3`).
