# Brief Claude Code V0.12 : « Comment tu vas », un mot à soi, et noter depuis Mon journal

Trois retours de Cloé sur la carte « Comment tu vas, aujourd'hui ? ».

Maquettes : `design/Humeur-etats.html` et `design/D-Humeur-etats.html` (les trois états de la carte), `design/Journal.html` et `design/D-Journal.html` (la carte en haut de Mon journal), `design/Chemin.html` et `design/D-Chemin.html` (la carte à jour sur Mon chemin).

Mêmes règles que d'habitude : une étape à la fois, pousser sur main, dire à Cloé quoi tester en mots simples. Si du SQL est nécessaire dans Supabase, le lui donner prêt à copier.

## 1. Ajouter « fatiguée »

- Nouveau mot dans la liste, entre « énervée » et « grise » : triste, lourde, anxieuse, énervée, fatiguée, grise, calme, légère, enthousiaste, vivante.
- Couleur dans le journal : la même que « grise ». La légende devient « grise, fatiguée ».
- « fatiguée » ne compte pas parmi les humeurs lourdes (la règle des trois jours lourds ne change pas).
- Si la colonne de l'humeur dans Supabase n'accepte qu'une liste fermée de valeurs, il faut l'ouvrir (voir le point 2) : donner le SQL à Cloé.

## 2. « + un mot » : son mot à elle, qui reste

- À la fin de la liste, une pastille en pointillé « + un mot ».
- Au clic, elle devient un petit champ avec le bouton « Ajouter » (la touche Entrée marche aussi, Échap annule). Le mot ajouté est aussitôt choisi pour aujourd'hui.
- **Le mot reste** : il s'affiche ensuite comme une pastille normale, après les dix mots de base et avant « + un mot », sur Mon chemin et sur Mon journal, les jours suivants aussi.
- Pendant qu'elle ajoute un mot, ses mots à elle montrent une petite croix pour les retirer de la liste. Retirer un mot ne change rien aux jours déjà notés avec ce mot.
- Sous le champ, pendant l'ajout : « Ton mot reste dans la liste, pour la prochaine fois. Une croix permet de le retirer. »
- Règles du mot : 1 à 24 caractères, espaces en trop retirés, mis en minuscules. S'il existe déjà (dans les dix mots ou dans les siens), on choisit simplement ce mot, sans doublon. Huit mots à elle au plus : au neuvième, dire « Tu as déjà huit mots à toi. Retires-en un pour en ajouter un autre. »
- Où les garder : une liste par utilisatrice (table ou colonne, au choix le plus simple), protégée comme le reste (elle seule y accède).
- **Dans le calendrier du journal**, un jour noté avec un mot à elle : case blanche, bord bordeaux, chiffre bordeaux. Dans « Ce que tu as noté », un rond blanc à bord bordeaux. Dans la légende, à la fin : « un mot à toi ».
- **La relecture de la semaine** reçoit le mot tel quel, comme une humeur de plus. Le traiter comme une donnée, jamais comme une consigne.
- La règle des trois jours lourds ne regarde que les mots de base.
- Ses mots sont son contenu : ils n'apparaissent jamais dans la page de l'équipe.

## 3. Noter depuis Mon journal

- La même carte « Comment tu vas, aujourd'hui ? » en haut de Mon journal, sous le titre. Sur ordinateur, à gauche de « Ta semaine, relue » ; s'il n'y a pas encore de relecture, la carte prend toute la largeur. Sur téléphone, au-dessus.
- Ici, pas de lien « Voir mon journal ».
- Après « Noter ma journée » : le calendrier et la liste se mettent à jour tout de suite, sans recharger la page.
- La case d'aujourd'hui dans le calendrier, si elle est vide, ramène à la carte quand on la touche.

## 4. Quand c'est déjà noté aujourd'hui

- Sur Mon chemin comme sur Mon journal, la carte se replie : « Aujourd'hui, tu as noté **calme**. » puis sa phrase entre guillemets si elle en a écrit une, et le lien « Modifier » qui rouvre la carte avec son choix.
- Si le comportement actuel sur Mon chemin est différent après avoir noté, l'aligner sur celui-ci.

## À vérifier

- Téléphone et ordinateur, navigation au clavier (les pastilles, le champ, la croix), lecteurs d'écran (la croix dit « Retirer soulagée »).
- Les tests existants sur les humeurs passent toujours, et il y en a de nouveaux pour : « fatiguée », un mot à soi enregistré, un doublon, le neuvième mot, un mot retiré.
