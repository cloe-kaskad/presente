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
- « Les questions vont un peu plus loin de mois en mois. À la fin de chaque mois, on vous demande à chacune si vous avez envie de continuer. »
- « Pas de messagerie ni de numéro à échanger pendant le chemin : juste ses mots et les tiens. À la fin de ton chemin, si vous en avez envie toutes les deux, vous pourrez vous écrire en dehors. »

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
- la question de la semaine, avec « Mois 1, question 1 sur 4 » ;
- sa réponse à elle, puis celle d'Inès une fois la sienne donnée (comme aujourd'hui).

## Après avoir répondu : dire la suite

Aujourd'hui, après « C'est noté. », il n'y a plus rien. Ajouter sous les deux réponses :

- « Prochaine question lundi 30 novembre. » (sept jours après le début de la question en cours, même règle que les étapes du chemin). En mode test, le lien « Ouvrir la suite maintenant » fait aussi avancer la question.
- les questions passées restent lisibles en dessous, repliées, la plus récente en haut : « Semaine 1 : Qu'est-ce que tu as osé… ».
- après la quatrième question de chaque mois : « Un mois que vous vous lisez. Envie de continuer avec Inès ? » Boutons « Oui, on continue » et « On s'arrête là ». Chacune répond de son côté. Si l'une arrête, l'autre voit seulement « L'échange s'est arrêté. » et peut demander une nouvelle buddy. En test, Inès dit oui.

## Des questions qui vont plus loin de mois en mois

L'échange dure tout le chemin (trois mois, douze questions). On ne demande jamais à l'une de juger l'autre : après quelques phrases lues, ce serait trop dur et pas juste.

- **Mois 1, ce que je fais** : des questions de faits, faciles. Exemples : « Qu'est-ce que tu as osé cette semaine, même petit ? », « Qu'est-ce que tu as fait pour toi et pour personne d'autre ? », « Où as-tu dit oui en pensant non ? ».
- **Mois 2, ce qui résiste** : « Qu'est-ce que tu remets à plus tard depuis longtemps, et que tu sais ? », « De quoi as-tu peur que les autres pensent ? », « Qu'est-ce que tu n'as encore dit à personne sur ce que tu traverses ? ».
- **Mois 3, ce que j'emporte** : « Qu'est-ce qui a bougé chez toi et que personne n'a encore remarqué ? », « Qu'est-ce que tu ne feras plus comme avant ? », « Que dirais-tu à celle que tu étais il y a trois mois ? ».
- **La dernière question de chaque mois est la même** : « Dans ce qu'elle a écrit ce mois-ci, quelle phrase t'est restée ? ». Elle choisit une phrase de l'autre (en la touchant dans la liste de ses réponses) et peut ajouter une ligne. C'est un cadeau, pas une analyse.
- **« Un mot pour elle »**, à partir de la deuxième question : après avoir lu la réponse de l'autre, elle peut laisser une seule ligne (140 caractères au plus), une fois par semaine. Ce n'est pas une messagerie : pas de réponse à la réponse.

Mettre les douze questions dans `lib/buddy/questions.ts` avec leur mois, et douze réponses toutes faites pour Inès dans `lib/buddy/profil-test.ts` (textes provisoires, Cloé les réécrira). Inès laisse aussi « un mot » scripté une semaine sur deux.

## S'écrire en dehors : seulement après la fin du chemin

- Jamais pendant les trois mois. C'est annoncé dès l'écran « Comment ça se passe ».
- Au dernier palier (fin du mois 3), une carte : « Ton chemin se termine. Envie de garder le lien avec Inès ? ». Chacune répond de son côté. Si l'une dit non ou ne répond pas, l'autre voit seulement « Merci pour ces trois mois à deux. », sans savoir qui a dit quoi.
- Si les deux disent oui : chacune tape le contact qu'elle veut donner (adresse mail, téléphone ou Instagram, un seul champ libre). On ne prend rien dans son compte. Le contact de l'autre s'affiche une fois, et on ne le garde pas plus de trente jours.
- Si elles se rencontrent avant, au cercle de parole (voir plus bas), elles font ce qu'elles veulent : le site ne s'en mêle pas.
- Un lien « Quelque chose me gêne » dans « Comment ça marche », dès le premier jour : il envoie un message à l'équipe. C'est le seul cas où l'équipe lit un échange, et seulement celui-là, parce qu'elle le demande. Le dire en une ligne sous le lien.
- **En test** : accessible par le panneau « Mode test » (« Aller à la fin du chemin à deux »). Aucun vrai contact : à la place, « Ici, tu recevrais le contact d'Inès. ».

## Le cercle de parole (carte « comme si » seulement)

Rien à construire pour l'instant. En test, une carte sur Mon chemin au début du mois 2, avec le bandeau « phase de test » : « Ton premier cercle. Six femmes en chemin, 1 h 15, à Kaskad République ou en visio. Ta buddy y sera. » Bouton « Je veux en être » qui note seulement l'événement `cercle_interet`. Cloé décidera ensuite qui anime et si le cercle est compris dans le prix.

## Ce qu'on retire ou qu'on déplace

- **Retirer la phrase** « Et tes réponses aux questions de la semaine. Rien d'autre : ni ton carnet, ni ton journal, ni ta carte. » Elle fait naître une inquiétude que personne n'avait. Ne la remettre nulle part.
- **Retirer le bloc « Ce que Inès voit de toi »** de la page : l'information est donnée une fois, à l'écran 3. À la place, en bas de page, un lien discret « Comment ça marche » qui rouvre le texte de l'écran 2.
- **« Arrêter l'échange »** ne doit plus être la seule chose visible après la réponse. Le mettre à l'intérieur de « Comment ça marche », en dernière ligne, en petit : « Tu peux arrêter l'échange quand tu veux. » avec le lien.
- Écrire « Ce qu'Inès » et non « Ce que Inès » partout où le prénom commence par une voyelle (prévoir l'élision pour les vrais prénoms).

## À vérifier

- Une testeuse qui a déjà commencé l'échange avec Inès (Cloé) : ne pas lui refaire passer les écrans 2 à 4. Elle voit directement la page mise à jour. Le panneau « Mode test » garde un lien « Recommencer la buddy depuis le début » pour qu'elle puisse revoir tout le déroulé.
- Événements à noter en plus : `buddy_explication_vue`, `buddy_recherche_lancee`, `buddy_rencontree`.
- Téléphone et ordinateur, navigation au clavier, mouvement réduit respecté.

## Maquettes (22 novembre, soir) : elles priment sur les textes ci-dessus pour les écrans 2 et 4

Cloé a demandé de redessiner la page de proposition et l'attente. Les maquettes sont dans `design/` :

- `Duo-A.html` (téléphone) et `D-Duo-A.html` (ordinateur) : la page « Un bout de chemin à deux ». `Duo-A-plus.html` montre « En savoir plus » déplié.
- Le visuel : deux voies parallèles avec leurs étapes, comme sur un plan. Elles ne se croisent jamais et ne s'enlacent pas (Cloé a refusé une première version, trop romantique). Reprendre le dessin des maquettes tel quel.
- `Duo-cherche.html` puis `Duo-attente.html` (et `D-Duo-attente.html`) : après « Ça me tente », deux à trois secondes d'animation plein écran (deux voies parties de loin finissent côte à côte), puis le message sur le même écran, puis un seul bouton « Retour à mon chemin ». `Duo-attente-auto.html` est la variante avec retour automatique : ne la coder que si Cloé la demande.
- `Duo-etats.html`, `D-Duo-etats.html` : la carte sur Mon chemin et ses quatre états (recherche en cours, trouvée, pas encore trouvée après 24 heures, « Pas maintenant » choisi).
- `Duo-email.html` : l'email « On a trouvé ta buddy ». Si l'envoi d'emails n'existe pas encore sur le site, le dire à Cloé et ne faire que la carte sur Mon chemin.

Ce qui change par rapport au texte plus haut :

- la page de proposition n'a plus quatre puces : une accroche, le visuel des deux tracés, trois temps courts, le reste derrière « En savoir plus » ;
- les deux boutons sont visibles sans défiler sur téléphone ;
- l'écran de la phrase de présentation (écran 3) reste tel que décrit, entre « Ça me tente » et l'animation ;
- le mouvement respecte « mouvement réduit » : dans ce cas, pas d'animation, le message s'affiche tout de suite ;
- **le mot « buddy » va changer** : Cloé choisit un autre mot. Mettre tous les textes qui le contiennent dans un seul fichier (`lib/buddy/textes.ts`) pour pouvoir le remplacer partout d'un coup.
