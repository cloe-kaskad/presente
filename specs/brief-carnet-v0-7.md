# Brief Claude Code V0.7 : le carnet redessiné

Cloé trouve la page « Mon carnet » actuelle pas belle : tout est en gras italique à la même taille, sans date ni repère. On la redessine. Mêmes règles que d'habitude : pousser sur main, lui dire quoi tester en mots simples.

À faire après l'étape 3 de `specs/brief-usage-v0-6.md` (« Mes exercices en cours » dans Mon chemin).

## Les maquettes font foi

- `design/Carnet.html` (mobile)
- `design/D-Carnet.html` (ordinateur)

Les notes affichées sont des exemples : garder les vraies données.

## Ce qui change

1. **Un fil daté, le plus récent en haut.** Les notes sont regroupées par semaine du chemin (« Semaine 3 · L'Argent », avec les dates de la semaine et le nombre de notes). La semaine en cours porte la pastille « Cette semaine ».
2. **Chaque note a une date et une origine.** La date du jour à gauche (ordinateur) ou au-dessus (mobile). Puis d'où vient la note, en petit rouge : « Après le podcast « titre » », « Exercice · nom », « La Question Chérie », « Écho du carnet ». À droite, une pastille quand il y en a une : l'avis donné (« ça m'a parlé », « moyen »…) ou l'avancement de l'exercice (« jour 3 sur 7 »).
3. **Ses mots en texte courant.** La question en petit et atténué (14 px, bordeaux à 72 %), sa réponse en dessous en DM Sans normal, 19 px sur ordinateur et 17 px sur mobile, bordeaux, interligne 1,55. Plus de gras italique, plus de guillemets autour de chaque réponse.
4. **Une feuille blanche par semaine**, sur le fond rose pâle. À l'intérieur, les notes sont séparées par un filet rose pâle. Sur ordinateur, le titre de la semaine est à gauche et reste visible pendant qu'on défile (position sticky), la feuille est à droite (760 px maximum).
5. **Des filtres** sous la recherche : Tout, Contenus, Exercices, Questions du jour, Au début. Un seul actif à la fois. Ils se combinent avec la recherche. Sur mobile, la rangée défile horizontalement.
6. **« Au début du chemin » replié** tout en bas : une ligne en pointillés avec « Déplier ». Dépliée, elle montre ses réponses au questionnaire dans le même style que le reste.
7. L'en-tête : le titre « Carnet », le texte d'explication (version courte de la maquette), la recherche, « Télécharger ». La phrase de confidentialité reste en bas.

## Données

- Il faut la date de chaque note (`created_at`) et son origine. Si l'origine n'est pas stockée aujourd'hui, la déduire du `type` et du `code` déjà présents dans `carnet_entries` (avant, carnet, exercice, geste, question chérie, écho). Ne pas ajouter de colonne si on peut l'éviter.
- Les entrées d'un exercice sur plusieurs jours apparaissent chacune à sa date.
- Le téléchargement suit le même ordre et les mêmes regroupements.
- Rien ne change côté confidentialité : RLS, rien dans les logs.

## États à prévoir

- Carnet vide : la phrase actuelle (« Ton carnet est encore vide… »).
- Aucun résultat pour la recherche ou le filtre : « Rien ne correspond. » avec un lien « Tout afficher ».
