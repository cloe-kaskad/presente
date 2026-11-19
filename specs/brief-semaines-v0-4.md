# Brief Claude Code V0.4 : faire vivre les quatre semaines

À lire avec `BRIEF.md` (étapes 6 et 7), `specs/questions-avant-apres-v0.md`, `specs/mondes-v0.md`, `prompts/moteur-ecriture.md` et les maquettes `design/Semaine-quete.html`, `design/Exercice.html`, `design/Acte.html`, `design/Episode-monde.html`, `design/Palier.html`, `design/Carnet.html` (et leurs versions `D-`).

## Le but

Aujourd'hui, la page d'une semaine montre le contenu, et c'est tout. On veut qu'une semaine se vive de bout en bout : un mot avant, le contenu, le carnet juste après, puis l'exercice ou le geste. Et que tout ce qu'elle écrit se retrouve dans son carnet et nourrisse la suite.

On fait comme si les podcasts maison des mondes existaient : un même fichier audio provisoire pour tous les épisodes, avec le vrai titre, la vraie fiche et les vraies questions.

## Semaine 1 et semaine 3 : la quête

Dans l'ordre, sur une seule page qui se déplie étape par étape (l'étape suivante s'ouvre quand la précédente est faite) :

1. **Avant d'écouter** : un texte écrit par le moteur (emplacement `avant_contenu`), qui relie ce contenu à ce qu'elle a écrit. Puis la question « avant » de `specs/questions-avant-apres-v0.md` (un mot, une phrase).
2. **Le contenu** : image, résumé, bouton (déjà en place).
3. **Ton carnet** (2 minutes) : les questions du carnet de la quête pour cette semaine, dans `specs/questions-avant-apres-v0.md`. Les questions sont fixes, jamais réécrites par l'IA. Plus « Ce contenu, pour toi : ça m'a parlé / pas maintenant / pas pour moi ».
4. **Semaine 1, l'exercice** : la pratique choisie dans Airtable (rôle « ouvrir »). Introduction écrite par le moteur (`intro_exercice`) avec un exemple tiré de ce qu'elle vient d'écrire dans le carnet. Puis la consigne, les règles et « pourquoi ça compte » en dépliants, et le formulaire selon le champ « Forme de réponse » de la pratique.
   **Semaine 3, l'acte** : la pratique de rôle « agir », introduction `intro_acte`, le bouton « Décaler », puis « Je l'ai fait » avec ses questions de retour.
5. **J'ai terminé** : la semaine est marquée faite, la suivante s'ouvre.

## Semaine 2 et semaine 4 : le monde

1. **Avant d'écouter** : texte du moteur (`avant_episode`) + la question d'ouverture de l'épisode (`specs/mondes-v0.md`).
2. **Le lecteur audio** : titre de l'épisode, lecture, pause, plus et moins 15 secondes, reprise là où elle s'est arrêtée. Fichier provisoire `public/audio/provisoire.mp3`. Mention « Podcast original Présente! ». La fiche de l'épisode en dépliant.
3. **Après** : le mini-questionnaire de l'épisode (sa forme varie selon l'épisode : frise, choix, texte libre). La réponse marquée « sert à adapter » dans les specs est enregistrée à part pour le moteur.
4. **Semaine 4** : après l'épisode, **le palier** (maquette `Palier.html`) : la phrase du moteur qui relie ce qu'elle a écrit dans le mois (`palier`), ses mots repris, « Qu'est-ce qui a bougé ? », « Qu'est-ce qui résiste encore ? », puis l'annonce du mois suivant.

## Le carnet

- Une page « Mon carnet » (maquette `Carnet.html`) : tout ce qu'elle a écrit, du plus récent au plus ancien, groupé par semaine, avec la question au-dessus de chaque réponse. Recherche par mot. Lien dans la barre du haut de son espace.
- Tout va dans `carnet_entries` (semaine, type, question, réponse). Sauvegarde automatique, comme le questionnaire.

## Le moteur d'écriture

- Nouveaux emplacements à brancher : `avant_contenu`, `avant_episode`, `intro_exercice`, `intro_acte`, `palier`. Ils existent déjà dans le prompt et dans la table.
- Le moteur reçoit ses réponses au questionnaire **et** ses entrées de carnet des semaines précédentes : c'est ce qui rend la semaine 3 plus juste que la semaine 1.
- Mêmes garde-fous que pour la carte : règles automatiques, seconde passe, texte de secours, détresse. Un texte de secours est retenté à la visite suivante.
- Les textes sont écrits au moment où elle ouvre la semaine. Pendant ce temps, afficher le composant `Mantra` (déjà dans `components/`).

## Déjà en place, à ne pas refaire

- Les boutons « Commencer mon chemin » de la carte mènent à `/bienvenue` (écran de mantras), puis à `/chemin`. Dans le vrai produit, le paiement Stripe se placera entre les deux : ne rien coder pour le paiement maintenant.
- La barre du haut de « Mon espace » reste fixe. La reprendre sur les pages de semaine et sur le carnet.
- Le bouton de démo « passer à la semaine suivante ».

## Ordre de travail

1. Le carnet (table, sauvegarde, page « Mon carnet »).
2. Semaine 1 complète (avant, contenu, carnet, exercice).
3. Semaine 2 (lecteur audio, mini-questionnaire).
4. Semaine 3 (acte) et semaine 4 (épisode 2, palier).
5. Les textes du moteur pour ces emplacements, avec les entrées de carnet en entrée.

À chaque étape, pousser sur main et dire à Cloé quoi tester, en mots simples.

## C'est réussi si

- Cloé peut faire son mois 1 d'une traite avec le bouton de démo, en écrivant pour de vrai.
- Chaque texte « avant » et chaque introduction d'exercice parle d'elle, sans rien inventer.
- Tout ce qu'elle écrit se retrouve dans « Mon carnet ».
