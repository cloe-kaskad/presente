# Brief Claude Code V0.11 : la buddy, un parcours qui s'explique

Retours de Cloé après son premier essai de la buddy en mode test. Le fond est bon (une question par semaine, la réponse de l'autre visible après la sienne). Ce qui manque : on ne lui explique rien, on lui montre l'autre tout de suite, et après sa réponse elle ne sait pas ce qui vient ensuite.

Ce brief remplace le déroulé de la partie 3 de `brief-test-v0-10.md`. Les règles de fond ne changent pas : accord des deux, pas de messagerie libre, pas de coordonnées, profil de test toujours signalé.

Mêmes règles que d'habitude : une étape à la fois, pousser sur main, dire à Cloé quoi tester en mots simples.

## Le nouveau déroulé, en cinq écrans

### 1. La proposition (inchangée)

Sur Mon chemin, au quatorzième jour : « Envie de faire un bout de chemin à deux ? ». Boutons « Oui, dites-m'en plus » (au lieu de « Oui, présentez-moi quelqu'un ») et « Pas maintenant ».

### 2. « Comment ça se passe » (nouveau)

Un écran à lire avant de s'engager. Titre : « Un bout de chemin à deux ». Texte court, en quatre points, sans numérotation :

- « On te présente une femme qui est en chemin depuis à peu près aussi longtemps que toi, et si possible sur une quête que vous avez en commun. »
- « Chaque semaine, une question, la même pour vous deux. Tu réponds en quelques lignes, quand tu veux dans la semaine. Tu lis sa réponse dès que tu as donné la tienne. »
- « Ça dure quatre semaines. Ensuite, on vous demande à chacune si vous avez envie de continuer. »
- « Pas de messagerie, pas de numéro à échanger. Juste ses mots et les tiens. »

En dessous, une phrase sur ce que ça apporte : « Ce que ça change : savoir qu'une autre avance en même temps que toi, et lire comment elle s'y prend. »

Boutons : « Ça me tente » et « Pas maintenant ».

### 3. Sa phrase (déplacé ici)

« Ce qui t'amène ici, en une phrase. » Sous le champ, un aperçu de ce que l'autre verra : son prénom, sa quête du moment, sa phrase. Une ligne : « C'est tout ce qu'elle verra de toi, avec tes réponses aux questions de la semaine. » Bouton : « Chercher ma buddy ».

### 4. L'attente (nouveau)

On ne montre personne tout de suite. Écran : « On cherche ta buddy. » Puis : « Une femme en chemin depuis à peu près aussi longtemps que toi, si possible sur La Voix (sa quête du moment). On te prévient ici dès qu'on l'a trouvée. » Un petit mouvement discret (deux points qui se rapprochent, dans la charte), pas de barre de chargement.

Sur Mon chemin, pendant l'attente : une petite ligne « On cherche ta buddy. », sans bouton.

**En test** : la buddy est « trouvée » le lendemain (à la première visite après minuit), pour faire comme si. Dans le panneau « Mode test », ajouter le lien « Trouver ma buddy maintenant ». Le bandeau « Profil de test : Inès n'existe pas. » n'apparaît qu'à partir de la rencontre, pas pendant l'attente (on écrit à la place, en petit : « Phase de test : la recherche est simulée. »).

### 5. La rencontre

Sur Mon chemin, une carte qui apparaît en montant : « On a trouvé ta buddy. » avec le bouton « La rencontrer ».

La page `/buddy` montre alors, dans cet ordre :

- qui elle est : « Inès, en chemin depuis 15 jours, sur La Voix. » puis sa phrase de présentation. Le nombre de jours et la quête d'Inès se calent sur ceux de la testeuse (à un ou deux jours près) ;
- la question de la semaine, avec « Question 1 sur 4 » ;
- sa réponse à elle, puis celle d'Inès une fois la sienne donnée (comme aujourd'hui).

## Après avoir répondu : dire la suite

Aujourd'hui, après « C'est noté. », il n'y a plus rien. Ajouter sous les deux réponses :

- « Prochaine question lundi 30 novembre. » (sept jours après le début de la question en cours, même règle que les étapes du chemin). En mode test, le lien « Ouvrir la suite maintenant » fait aussi avancer la question.
- les questions passées restent lisibles en dessous, repliées, la plus récente en haut : « Semaine 1 : Qu'est-ce que tu as osé… ».
- après la quatrième question : « Vous êtes arrivées au bout des quatre semaines. Envie de continuer avec Inès ? » Boutons « Oui, on continue » et « On s'arrête là ». En test, Inès dit oui.

## Ce qu'on retire ou qu'on déplace

- **Retirer la phrase** « Et tes réponses aux questions de la semaine. Rien d'autre : ni ton carnet, ni ton journal, ni ta carte. » Elle fait naître une inquiétude que personne n'avait. Ne la remettre nulle part.
- **Retirer le bloc « Ce que Inès voit de toi »** de la page : l'information est donnée une fois, à l'écran 3. À la place, en bas de page, un lien discret « Comment ça marche » qui rouvre le texte de l'écran 2.
- **« Arrêter l'échange »** ne doit plus être la seule chose visible après la réponse. Le mettre à l'intérieur de « Comment ça marche », en dernière ligne, en petit : « Tu peux arrêter l'échange quand tu veux. » avec le lien.
- Écrire « Ce qu'Inès » et non « Ce que Inès » partout où le prénom commence par une voyelle (prévoir l'élision pour les vrais prénoms).

## À vérifier

- Une testeuse qui a déjà commencé l'échange avec Inès (Cloé) : ne pas lui refaire passer les écrans 2 à 4. Elle voit directement la page mise à jour. Le panneau « Mode test » garde un lien « Recommencer la buddy depuis le début » pour qu'elle puisse revoir tout le déroulé.
- Événements à noter en plus : `buddy_explication_vue`, `buddy_recherche_lancee`, `buddy_rencontree`.
- Téléphone et ordinateur, navigation au clavier, mouvement réduit respecté.
