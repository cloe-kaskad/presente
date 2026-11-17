# Mise en route (étape 1)

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
