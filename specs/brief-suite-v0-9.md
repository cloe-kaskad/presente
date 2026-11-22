# Brief Claude Code V0.9 : « J'ai écouté », les étapes de la semaine, la date de la suite, le dossier

Retour de Cloé après son premier podcast : rien ne lui permet de dire qu'elle a écouté, et en arrivant sur Mon chemin elle ne sait pas ce qui est fait ni quand vient la suite. Elle veut aussi une petite lecture pour tenir la semaine.

Mêmes règles que d'habitude : une étape à la fois, pousser sur main, lui dire quoi tester en mots simples, SQL prêt à copier.

## Les maquettes font foi

| Écran | Mobile | Ordinateur |
| --- | --- | --- |
| Un contenu, pas encore écouté | `design/Contenu-avant.html` | `design/D-Contenu-avant.html` |
| Un contenu, écouté | `design/Contenu-apres.html` | `design/D-Contenu-apres.html` |
| Mon chemin, la carte de la semaine | `design/Chemin.html` | `design/D-Chemin.html` |
| Le dossier de la semaine | `design/Dossier.html` | `design/D-Dossier.html` |

Les textes entre crochets dans le dossier sont des emplacements : le vrai contenu viendra d'Airtable.

## 1. « J'ai écouté »

- Sur la carte du contenu (podcast, vidéo, épisode de monde), à côté de « Écouter », un second bouton en contour : « J'ai écouté » (« J'ai regardé » pour une vidéo, « J'ai lu » pour un texte).
- Au clic : on enregistre la date, la carte affiche une pastille blanche « ✓ Écouté le 16 novembre » et un lien « Réécouter ». La coche se dessine (animation prévue au brief V0.8). On peut annuler en recliquant sur la pastille.
- Remplir le carnet ne suffit plus à valider l'écoute, et l'écoute ne dépend plus du carnet : ce sont deux étapes distinctes. Si elle a déjà rempli le carnet pour un contenu avant ce changement, considérer le contenu comme écouté.
- Stockage : une date par contenu et par semaine (colonne ou entrée dans la progression existante). Donner le SQL à Cloé si une colonne est nécessaire.

## 2. La carte « Cette semaine » sur Mon chemin

Remplacer la grille de quatre cartes égales par :

- à gauche, une grande carte rouge « Cette semaine · semaine 3 · agir », avec le titre, puis la liste des étapes de la semaine, chacune avec son état :
  - faite : rond blanc avec coche, texte un peu atténué, et à droite quand (« lundi ») ou combien (« 2 notes ») ;
  - en cours : arc, texte en gras, à droite « jour 3 sur 7 » ;
  - à faire : rond en pointillés, à droite la durée (« 5 min de lecture ») ;
- les étapes d'une semaine de quête : le contenu, le carnet, l'exercice (ou le geste), le dossier de la semaine. Pour une semaine de monde : l'épisode, les questions d'après (et le palier en semaine 4). S'appuyer sur `lib/semaines/etapes.ts` ;
- chaque ligne est un lien vers l'étape ;
- en bas de la carte : un bouton blanc qui mène à **la prochaine chose à faire** (son libellé change : « Écouter le podcast », « Écrire dans mon carnet », « Reprendre mon exercice », « Lire le dossier »), et la phrase « Ta prochaine étape arrive **lundi 23 novembre**. » ;
- quand tout est fait : la phrase devient « Tu es à jour. D'ici lundi 23 novembre : ton exercice et ton rituel du jour. » et le bouton disparaît ;
- à droite, les autres semaines du mois en lignes compactes : la suivante d'abord (pointillés, « arrive lundi 23 novembre »), puis les semaines faites (coche). Sur mobile : la carte, la semaine suivante, puis un lien « Voir les semaines faites (2) ».

### La date de la suite

- Règle de Cloé : une étape arrive **7 jours après le début de la précédente**. Le début d'une semaine est la date à laquelle elle l'a ouverte pour la première fois (le début du chemin pour la semaine 1).
- Enregistrer cette date de début par semaine si elle ne l'est pas déjà.
- Avant cette date, la semaine suivante est visible mais pas ouvrable. Le jour venu, elle s'ouvre, que la précédente soit finie ou non (ce qui n'est pas fini reste dans « Mes exercices en cours » et dans la liste).
- Pour la démo, garder un moyen pour Cloé et Stéphanie d'ouvrir la suite sans attendre (un lien discret « Ouvrir la suite maintenant », visible seulement pour les comptes de la liste d'accès V0).
- Afficher la date en toutes lettres, avec le jour de la semaine, au fuseau Europe/Paris.

## 3. Le dossier de la semaine

Une lecture maison de cinq minutes, une par semaine de quête, écrite et validée par l'équipe. Elle n'est jamais générée par l'IA pour une utilisatrice.

- Nouvelle adresse : `/semaine/[n]/dossier`.
- Quatre blocs, toujours dans cet ordre : « Une idée » (philosophie), « Un chiffre », « Un regard » (sociologie, recherche), « Un écho » (actualité ou littérature). Chacun : un titre, un texte de trois ou quatre phrases, la source en petit. Grille de deux colonnes sur ordinateur, empilés sur mobile, fonds alternés comme sur la maquette.
- En bas : une ligne libre facultative « Ce que tu en gardes, en une ligne. » (rangée dans le carnet, origine « Dossier de la semaine »), et le bouton « J'ai lu » qui valide l'étape.
- Données : une nouvelle table Airtable « P! Dossiers » en lecture seule, que Claude (la session de Cloé) créera : Quête, Semaine dans le mois (1 ou 3), Titre, Chapô, et pour chaque bloc Titre, Texte, Source, Lien ; Statut (Brouillon, Validé). Le site n'affiche que les dossiers « Validé ». Lire la table comme les autres (`lib/catalogue/airtable.ts`), avec la variable d'environnement de la table à ajouter dans Vercel par Cloé.
- S'il n'y a pas de dossier validé pour la semaine : l'étape n'apparaît pas dans la liste, rien d'autre ne change.

## Ordre de travail

1. « J'ai écouté ».
2. La carte « Cette semaine », ses étapes et la date de la suite.
3. Le dossier de la semaine (quand la table Airtable existe).
