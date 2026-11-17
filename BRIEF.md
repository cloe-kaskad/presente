# Présente! : brief Claude Code V0

Lis aussi `specs/`, `prompts/moteur-ecriture.md` et les maquettes de `design/` avant de coder.

## Le but

Une démo privée pour Cloé et Stéphanie. Chacune se connecte, remplit le vrai questionnaire, et découvre le chemin que Présente! lui propose : sa carte, ses trois quêtes dans l'ordre, ses capacités, puis les semaines de son premier mois, avec des textes écrits pour elle à partir de ses mots. Deux personnes qui répondent différemment doivent obtenir deux chemins différents, et chacune doit s'y reconnaître.

Pas de paiement. Pas d'audio définitif. Pas de vraies utilisatrices.

## Ce qui est dans la V0

- L'accueil (`design/Main.html` en mobile, `design/D-Accueil.html` en ordinateur).
- La connexion par lien magique, réservée à une liste blanche d'emails.
- Le questionnaire complet en 5 parties, sauvegardé à chaque réponse, qu'on peut quitter et reprendre.
- Le calcul du chemin, selon la règle ci-dessous.
- L'écran « Ta carte » : les 7 quêtes situées, les 3 quêtes proposées dans l'ordre avec une phrase pour chacune, les 2 capacités, le bouton « Échanger une quête ».
- L'écran « Le chemin » : le mois 1 en détail, semaine par semaine, et les mois 2 et 3 en aperçu.
- Semaine 1 : le contenu de quête, le carnet juste après, puis l'exercice.
- Semaine 2 : l'épisode du monde (audio provisoire) et son mini-questionnaire.
- Semaine 3 : le contenu de quête, le carnet, puis l'acte dans la vraie vie.
- Semaine 4 : l'épisode 2 du monde, puis le palier.
- Le carnet, qui rassemble tout ce qu'elle a écrit.
- L'écran « Quand ça ne va pas ».

Hors V0 : Stripe, l'envoi de la carte postale (écran statique seulement), les cercles, les emails hebdomadaires, toute interface d'administration.

Pour tout tester en une soirée, un bouton discret « passer à la semaine suivante » débloque les semaines sans attendre le calendrier.

## Stack

- Next.js (App Router, TypeScript), déployé sur Vercel, fonctions en région Paris (cdg1).
- Supabase : Postgres, authentification par lien magique, Row Level Security sur toutes les tables. Projet en région UE.
- Resend comme SMTP de Supabase pour l'email de connexion (réglé par Cloé dans Supabase).
- API Claude (SDK Anthropic), appelée uniquement côté serveur. Le modèle est une variable d'environnement (Sonnet récent par défaut).
- Airtable en lecture seule, côté serveur, avec un cache.

Variables d'environnement, saisies par Cloé dans Vercel (jamais dans le code ni dans Git) : `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` (facultative), `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAILS`. Fournir un `.env.example` avec ces noms.

## Les données

### Supabase

- `profiles` : prénom, âge, code postal, temps par semaine, formats préférés, sujets à éviter.
- `questionnaire_responses` : une ligne par partie, en jsonb, avec la date. On garde l'historique : le questionnaire sera repassé à la fin du chemin.
- `paths` : les 3 quêtes dans l'ordre, les 2 capacités de chacune, les 3 mondes, la date de début, la semaine en cours.
- `generated_texts` : chaque texte écrit par le moteur, avec son emplacement, pour ne pas le régénérer à chaque visite.
- `carnet_entries` : chaque réponse de carnet, de mini-questionnaire, d'exercice et d'acte, avec la semaine et la question.
- `moods` : le « comment tu vas aujourd'hui ».

Règle absolue : personne de l'équipe ne lit les réponses. Chaque utilisatrice ne voit que ses lignes (RLS), aucune page d'administration, et le contenu des réponses n'apparaît jamais dans les logs.

### Airtable (base `appXzGMlNyLLQeRwY`)

- Médiathèque LC `tblmx8Y2GM25fScZj` : utiliser seulement les champs préfixés « P! ». Ne jamais écrire dans cette table : c'est celle du site public de Liberté, Chérie !.
- P! Contenus hors médiathèque `tblVAGua7hcNY49W1` : filtrer sur Validation = Validé.
- P! Pratiques `tbl9qpu0UKRGO4Q6o` : filtrer sur Validation = Validé. Champs : Nom `fld6YKsImb79qYItj`, Quête `fldqVV6XhlJIrepgq`, Capacités `fldbq6rSnxfiU1aZO`, Rôle `flddLS9KZNwb4UbcF`, Forme de réponse `fldJCpf9NUqxVjII9`, Rythme `fldbSbOgom8J3xzXb`, Intensité `fldrQO1vmG8FsdPuM`, Adaptation `fldeMhC3dH9CTRUZl`, En bref `fld2w53sYFFXX51BL`, Consigne `fldcxgQo6OKuUtzNT`, Règles `fldBAPxef1DrdcnTs`, Pourquoi ça compte `fldPKYLXQteRrbURE`, Validation `fldJfVghs4LFlH55T`.

Le token Airtable n'a que le droit de lecture.

## Le questionnaire

Le texte complet est dans l'onglet « Questionnaire V0 » (voir `specs/README.md`) : les 4 questions ouvertes, les curseurs des 7 quêtes, les 49 phrases du zoom avec leurs codes, le fil rouge, la partie pratique. Les codes (AR1, VO2…) ne s'affichent jamais. Les questions sont fixes : le moteur d'écriture ne les modifie pas.

## Le calcul du chemin

C'est le cœur du produit. À coder dans un module pur, avec des tests.

1. **Score d'une quête** : (6 moins « où j'en suis ») multiplié par « mon envie ». De 1 à 25.
2. **Le zoom** (partie 3) affiche les 3 meilleurs scores, ou 4 en cas d'égalité au 3e rang.
3. **Les 3 quêtes** : les 3 meilleurs scores. En cas d'égalité, la réponse à « Laquelle t'appelle le plus, et pourquoi ? » départage : Claude lit la réponse et renvoie la quête nommée ou évoquée, en JSON. Si rien n'en ressort : l'envie la plus haute, puis le « où j'en suis » le plus bas.
4. **L'ordre** : mois 1, la quête où son envie est la plus haute. Mois 2, parmi les deux autres, celle où elle se sent le plus loin. Mois 3, la dernière. Égalité : le score départage.
5. **Les 2 capacités** de chaque quête : celles cochées au zoom (deux au plus). Si elle n'en a coché qu'une, la seconde est choisie par Claude parmi les codes de cette quête, à partir de ses réponses ouvertes. Si elle n'en a coché aucune, les deux.
6. **Les mondes** sont fixes pour la V0 : mois 1 Histoire, au prisme du féminisme ; mois 2 Philosophie pratique ; mois 3 Attention et réseaux.
7. **Échanger une quête** : elle remplace une des 3 par la 4e meilleure, ou par celle qu'elle choisit. L'ordre est recalculé.

Cas de test minimum : le profil de Camille (maquettes), deux quêtes à égalité avec une réponse ouverte claire, deux quêtes à égalité sans réponse exploitable, aucune capacité cochée.

## Le choix des contenus et des exercices

- **Contenu de quête** (semaines 1 et 3) : un contenu validé, tagué avec la quête et la capacité du moment, pris dans la médiathèque ou dans les contenus hors médiathèque. On respecte son temps disponible (question 5.1) et ses formats préférés (5.2).
- **Exercice** (semaine 1) : une pratique validée de la quête, taguée avec la capacité 1, dont le rôle correspond à « ouvrir ». **Acte** (semaine 3) : même logique avec la capacité 2 et le rôle « agir ». Prendre les valeurs du champ Rôle telles qu'elles sont dans Airtable.
- **Filtres** : jamais un contenu qui touche un sujet qu'elle a demandé d'éviter (5.3). Jamais un contenu qui suppose une situation qu'elle n'a pas décrite (enfants, couple…).
- **Épisodes de monde** : textes, questions avant et mini-questionnaires dans les onglets « Plans des mondes V0 » et « Questions avant et après V0 ». Audio provisoire : un même fichier court pour tous les épisodes.

## Le moteur d'écriture

Les questions sont fixes. Les textes autour sont écrits pour elle par Claude, avec le prompt système de `prompts/moteur-ecriture.md`.

Ce qu'il écrit :

- sur la carte, la phrase « pourquoi pour toi » de chaque quête ;
- avant chaque contenu et chaque épisode, le texte « avant » ;
- l'introduction de l'exercice et de l'acte, avec un exemple tiré de sa vie ;
- au palier, la phrase qui relie ce qu'elle a écrit dans le mois.

Les règles, à tester une par une :

- Il relie, il ne tranche pas : une lecture se propose sous forme de question ou de « peut-être ».
- Il cite ses mots exacts entre guillemets, sans les déformer, et n'invente aucun fait sur sa vie.
- Aucun diagnostic. Rien sur la santé. Rien sur la psychologie de ses proches.
- Les sujets qu'elle a demandé d'éviter ne sont jamais utilisés.
- Tutoiement, ton Liberté, Chérie !, phrases courtes. Jamais « empowerment », jamais « bienveillant·e », jamais de tiret cadratin.
- **Seconde passe** : chaque texte est relu par un second appel qui vérifie ces règles et renvoie OK ou KO en JSON. Si KO, un texte générique de secours le remplace.
- **Détresse** : si ses réponses ouvertes contiennent des signaux de détresse forte (vérification par Claude, doublée d'une liste de mots), elle ne voit pas sa carte mais l'écran « Quand ça ne va pas ». Le moteur ne génère alors plus rien.

Chaque texte est stocké dans `generated_texts` et n'est régénéré que si elle a écrit quelque chose de nouveau qui le concerne.

## Le design

- Les maquettes sont dans `design/` : 13 écrans mobile et 8 écrans ordinateur (fichiers `D-*.html`), avec les polices et les images dans `design/assets/`. Les reproduire fidèlement, en composants.
- Mobile d'abord. Ordinateur à partir de 1024 px.
- Typo : DM Sans partout. Les titres sont des phrases en minuscules, sans mot en capitales au milieu. La capitale condensée (Anton, provisoire en attendant la typo de Stéphanie) est réservée aux titres d'un seul nom : une quête, « Présente ! », un prix, un numéro.
- Couleurs Liberté, Chérie ! : rouge `#e6361d`, rouge profond `#c42c14` (texte courant), rose `#f7beca`, rose pâle `#fdf0f4`, bordeaux `#510004`, bleu ciel `#d4eaff` (les mondes). À poser en variables CSS : la DA de Stéphanie viendra les remplacer.
- Ses mots à elle : DM Sans italique semi-gras, bordeaux, sur un surlignage rose.
- Accessibilité : contrastes AA, focus visible, cibles tactiles de 44 px, mouvements réduits respectés.

## Sécurité

- Seuls les emails de `ALLOWED_EMAILS` peuvent se connecter.
- Les clés ne quittent jamais le serveur et ne sont jamais commitées.
- Les réponses passent par l'API Claude, hébergée aux États-Unis : acceptable pour une démo interne, à revoir avant toute ouverture.
- Une politique de confidentialité, même courte, est visible avant le questionnaire.

## L'ordre de travail

1. Le projet Next.js, le schéma Supabase avec RLS (en fichiers de migration SQL que Cloé pourra lancer), la connexion par lien magique, la liste blanche. Pousser sur GitHub pour que Cloé importe le projet dans Vercel.
2. Le questionnaire, avec sauvegarde automatique.
3. Le calcul du chemin et ses tests.
4. La carte et le chemin.
5. La lecture d'Airtable et le choix des contenus et exercices.
6. Le moteur d'écriture, avec la seconde passe et l'écran de détresse.
7. Les semaines 1 à 4, le carnet, le palier.
8. Le test par Cloé et Stéphanie sur l'adresse Vercel.

À chaque étape, montrer le résultat et dire à Cloé, en mots simples, ce qu'elle doit faire de son côté (réglage Supabase, variable Vercel…), une action à la fois.

## C'est réussi si

- Cloé et Stéphanie, avec des réponses différentes, obtiennent deux chemins différents, et chacune trouve le sien juste.
- Les textes reprennent leurs mots sans rien inventer.
- Tout fonctionne sur téléphone.
- Aucune réponse n'est lisible par quelqu'un d'autre que son autrice.
