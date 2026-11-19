# Brief Claude Code V0.5 : le rituel du jour dans « Mon espace »

À faire après (ou en parallèle de) `specs/brief-semaines-v0-4.md`. Mêmes règles : pousser sur main à chaque étape, dire à Cloé quoi tester en mots simples, lui donner le SQL prêt à copier.

## Le but

Donner envie d'ouvrir son espace chaque jour, pour une visite de deux minutes qui a un début et une fin. Pas de compteur de jours consécutifs, rien qui culpabilise.

En haut de « Mon espace », sous la barre fixe et avant les semaines, un bloc « Aujourd'hui » avec, dans cet ordre :

1. la phrase du jour ;
2. l'humeur, avec une phrase ;
3. un écho de son carnet ;
4. la Question Chérie ;
5. l'article à lire aujourd'hui.

Sur mobile, les blocs s'empilent. Sur ordinateur, phrase du jour en pleine largeur, puis une grille. Garder la charte (texte courant bordeaux sur fonds clairs pour ce qui se lit, rouge pour les titres).

## 1. La phrase du jour

- La même pour toutes, une par jour, choisie par la date dans une liste (fichier `lib/rituel/phrases.ts`, une centaine de phrases ; partir de celles de `components/Mantra.tsx` et en écrire d'autres dans le même ton : court, vrai, jamais « empowerment », jamais d'injonction).
- Affichée en grand, sur le fond à grain.

## 2. L'humeur, avec une phrase

- Les mots d'humeur actuels, plus un champ libre d'une ligne : « Pourquoi, en une phrase ? » (facultatif).
- Une entrée par jour, modifiable dans la journée. Table `moods` : ajouter `note text` et une contrainte d'unicité (user, jour). RLS comme les autres tables.
- Après l'envoi : « C'est noté. » et un lien « Voir mon journal ».

## 3. Le journal d'humeur (`/journal`)

- Un calendrier du mois : une pastille de couleur par jour selon l'humeur (du plus lourd au plus vivant, dans la palette), avec la phrase au survol ou au toucher. En dessous, la liste des jours avec leur phrase.
- Lien « Mon journal » dans la barre du haut.

## 4. Le résumé de la semaine (moteur d'écriture)

- Une fois par semaine (au premier passage après 7 jours, et s'il y a au moins 3 entrées), le moteur relit les entrées d'humeur de la semaine et écrit trois ou quatre phrases : ce qui revient, un lien entre les jours, une question à garder.
- Nouvel emplacement `journal_semaine` dans `prompts/moteur-ecriture.md` et dans la table `generated_texts` (clé : la date du lundi). Mêmes garde-fous : il relie, il ne diagnostique pas, rien sur la santé, citations exactes, seconde passe, texte de secours (dans ce cas, ne rien afficher plutôt qu'un texte générique).
- Affiché en haut du journal : « Ta semaine, relue ».

## 5. L'humeur ajuste le chemin

- Trois jours de suite parmi « triste », « lourde », « anxieuse » : sur la semaine en cours, proposer « Tu peux décaler le geste de cette semaine » et préférer un contenu d'intensité douce au prochain choix.
- Les phrases d'humeur passent par la même détection de détresse que le questionnaire : en cas de signal fort, écran « Quand ça ne va pas ».

## 6. L'écho du carnet

- Chaque jour, une de ses réponses de carnet ou du questionnaire, datée d'au moins 10 jours, choisie par la date : « Tu écrivais ça le 4 novembre. » suivi de ses mots, puis « C'est toujours vrai ? » avec trois réponses (oui / plus tout à fait / plus du tout) et une ligne libre facultative, enregistrées dans `carnet_entries`.
- Ne jamais reprendre une réponse qui touche un sujet à éviter. S'il n'y a rien d'assez ancien, ne pas afficher le bloc.

## 7. La Question Chérie

- Lue dans Airtable, table `tbl1Cs9vXd8kV9D5u` (« P! Questions chéries »), en lecture seule : Question `fldRRx8QdjtridCdq`, Date de l'édition `fldMHht3JNLJR3zX8`, Lien vers l'édition `fldgZVmuUgdQgLWw1`, Accroche `fldUYmk4oOXeDy5JQ`, Statut `fldVlsCSmDEczGRRT` (afficher la ligne « Validé » la plus récente).
- Affiche la question, un champ d'une ligne pour y répondre (va dans le carnet), et un lien « Lire l'édition » qui ouvre le lien dans un nouvel onglet.
- Sous le lien, si elle n'est pas abonnée : une case à cocher « Recevoir La Question Chérie, deux mercredis par mois » (jamais cochée d'avance). Stocker son choix dans `profiles.newsletter` ; l'inscription réelle à la newsletter sera branchée plus tard.
- Table vide : ne pas afficher le bloc.

## 8. À lire aujourd'hui

- Lu dans Airtable, table `tblnNOClHG4522gic` (« P! À lire aujourd'hui »), en lecture seule : Titre `fldqPNubIwpx7BcJR`, Date de publication `fldnBaooiFhkMJJYb`, Statut `fldnqIQq1LSSvxEBa`, Lien `fldTFnyWOoP20vORm`, Source `fldcerynNul7C3LoS`, Notre regard `fldheFTahAgYeH9Uo`.
- Afficher la ligne « Validé » dont la date est aujourd'hui ; sinon la plus récente des 3 derniers jours ; sinon rien.
- Titre, source, « Notre regard », image de la page (réutiliser `lib/catalogue/apercu.ts`), bouton « Lire l'article » (nouvel onglet).
- Les propositions arrivent chaque soir dans cette table, Cloé les valide dans Airtable : rien à coder pour ça.

## 9. Le chemin qui se dessine

- Dans le haut de « Mon espace », le tracé en S (celui de `app/carte/trace`) avec un point par étape du mois ; les étapes faites sont pleines. Pas de pourcentage.

## Plus tard (ne pas coder maintenant)

- « 34 femmes ont écrit dans leur carnet aujourd'hui » (il faut de vraies utilisatrices).
- Le rappel par email à l'heure choisie.

## Ordre de travail

1. Humeur avec phrase, journal, puis résumé de la semaine.
2. Phrase du jour et écho du carnet.
3. Question Chérie et article du jour.
4. L'humeur qui ajuste le chemin, puis le tracé.

## Confidentialité

Le journal d'humeur est très personnel : RLS stricte, rien dans les logs, et une phrase à ajouter dans la page de confidentialité (ce qui est enregistré, que personne de l'équipe ne le lit, qu'un outil d'IA le relit pour écrire le résumé).
