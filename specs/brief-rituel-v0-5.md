# Brief Claude Code V0.5 : le rituel du jour dans « Mon espace »

À faire après (ou en parallèle de) `specs/brief-semaines-v0-4.md`. Mêmes règles : pousser sur main à chaque étape, dire à Cloé quoi tester en mots simples, lui donner le SQL prêt à copier.

## Le but

Donner envie d'ouvrir son espace chaque jour, pour une visite de deux minutes qui a un début et une fin. Pas de compteur de jours consécutifs, rien qui culpabilise.

## Les maquettes font foi

Cloé a validé ces écrans. Les suivre de près (mise en page, tailles, ordre, textes) :

- `design/Chemin.html` et `design/D-Chemin.html` : « Mon espace » ;
- `design/Journal.html` et `design/D-Journal.html` : le journal d'humeur ;
- `design/Bienvenue.html` et `design/D-Bienvenue.html` : l'écran de citation (déjà en ligne) ;
- `design/Carte.html` et `design/D-Carte.html` : la lecture « voici ce qu'on a compris », refaite comme une lettre (voir l'étape 0).

Ordre de la page « Mon espace » :

1. la barre blanche fixe (Mon chemin, Mon journal, Mon carnet, Ma carte) ;
2. le bandeau à grain : la date, la citation du jour avec le nom de l'autrice, et à droite le chemin du mois qui se dessine ;
3. « Ton chemin, cette semaine. » : les quatre semaines (sur mobile, seulement la semaine en cours et une ligne « Voir tout le mois ») ;
4. « Aujourd'hui, deux minutes pour toi. » : à gauche l'humeur puis l'écho du carnet ; à droite, en petit, La Question Chérie puis l'article du jour. Sur mobile, les quatre blocs s'empilent dans cet ordre.

Garder la charte (texte courant bordeaux sur fonds clairs pour ce qui se lit, rouge pour les titres).

## 0. La lecture de la carte, comme une lettre

Sur `/carte`, refaire le bloc « voici ce qu'on a compris » d'après `design/D-Carte.html` et `design/Carte.html` :

- à gauche (ordinateur) : « Écrit pour toi, à partir de tes réponses. Toi seule peux le lire. », le titre, puis « Tes mots, qu'on a gardés » : trois ou quatre citations exactes de ses réponses, en italique ;
- à droite : une feuille blanche, colonne étroite. La phrase d'ouverture en grand, un petit filet rose, puis les trois lectures l'une sous l'autre (titre rouge, texte bordeaux 20 px, interligne 1,7), ses mots surlignés en rose dans le texte, et la note « C'est une lecture, pas un verdict. » en italique ;
- sur mobile : la lettre, puis ses mots, puis le bouton.

« Tes mots » : demander au moteur, dans la même réponse que la synthèse, une liste `mots` de 3 ou 4 citations courtes. Le code ne garde que celles qui figurent mot pour mot dans ses réponses (sinon on ne les affiche pas), et jamais sur un sujet à éviter. Ne rien changer au texte de la synthèse elle-même.

## 1. La citation du jour

- La même pour toutes, une par jour, choisie par la date dans la liste `MANTRAS` de `components/Mantra.tsx` (déplacer la liste dans `lib/rituel/citations.ts` et l'importer aux deux endroits).
- Uniquement des phrases de femmes, avec leur nom et la source. Ne pas en ajouter : c'est Cloé qui valide chaque citation, la liste grandira plus tard.
- Affichée en grand, entre guillemets, sur le fond à grain, avec « Prénom Nom, source » dessous.

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
- Bloc compact, fond bordeaux, avec une petite image carrée à gauche du titre (`public/images/ecrire.jpg` pour l'instant, la même pour toutes les lettres).
- Affiche la question, un champ d'une ligne pour y répondre (va dans le carnet), et un lien « Lire la lettre » qui ouvre le lien dans un nouvel onglet.
- Sous le lien, si elle n'est pas abonnée : une case à cocher « Recevoir La Question Chérie, deux mercredis par mois » (jamais cochée d'avance). Stocker son choix dans `profiles.newsletter` ; l'inscription réelle à la newsletter sera branchée plus tard.
- Table vide : ne pas afficher le bloc.

## 8. À lire aujourd'hui

- Lu dans Airtable, table `tblnNOClHG4522gic` (« P! À lire aujourd'hui »), en lecture seule : Titre `fldqPNubIwpx7BcJR`, Date de publication `fldnBaooiFhkMJJYb`, Statut `fldnqIQq1LSSvxEBa`, Lien `fldTFnyWOoP20vORm`, Source `fldcerynNul7C3LoS`, Notre regard `fldheFTahAgYeH9Uo`.
- Afficher la ligne « Validé » dont la date est aujourd'hui ; sinon la plus récente des 3 derniers jours ; sinon rien.
- Bloc compact : petite image carrée de la page à gauche (réutiliser `lib/catalogue/apercu.ts`), puis source, titre, « Notre regard » et le lien « Lire l'article » (nouvel onglet).
- Les propositions arrivent chaque soir dans cette table, Cloé les valide dans Airtable : rien à coder pour ça.

## 9. Le chemin qui se dessine

- Dans le haut de « Mon espace », le tracé en S (celui de `app/carte/trace`) avec un point par étape du mois ; les étapes faites sont pleines. Pas de pourcentage.

## Plus tard (ne pas coder maintenant)

- « 34 femmes ont écrit dans leur carnet aujourd'hui » (il faut de vraies utilisatrices).
- Le rappel par email à l'heure choisie.

## Ordre de travail

0. La lecture de la carte comme une lettre, et la nouvelle mise en page de « Mon espace ».
1. Humeur avec phrase, journal, puis résumé de la semaine.
2. Citation du jour et écho du carnet.
3. Question Chérie et article du jour.
4. L'humeur qui ajuste le chemin, puis le tracé.

## Confidentialité

Le journal d'humeur est très personnel : RLS stricte, rien dans les logs, et une phrase à ajouter dans la page de confidentialité (ce qui est enregistré, que personne de l'équipe ne le lit, qu'un outil d'IA le relit pour écrire le résumé).
