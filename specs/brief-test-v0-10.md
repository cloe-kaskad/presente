# Brief Claude Code V0.10 : mesurer l'engagement, la surprise « comme si », la buddy de test

Trois demandes de Cloé pour la phase de test (elle et Stéphanie). La première est la plus importante pour elle : à faire en premier, même avec deux testeuses.

Mêmes règles que d'habitude : une étape à la fois, pousser sur main, lui dire quoi tester en mots simples, SQL prêt à copier.

## 1. Mesurer l'engagement (priorité)

But : savoir où les femmes avancent, où elles s'arrêtent, au bout de combien de temps elles décrochent. C'est ce qui dira plus tard où placer les surprises.

### Ce qu'on enregistre

Une table `evenements` dans Supabase : `user_id`, `path_id`, `type`, `semaine` (1 à 12, facultatif), `cle` (facultatif : identifiant d'un contenu ou d'un exercice), `created_at`. RLS : une utilisatrice n'écrit et ne lit que ses lignes ; la lecture d'ensemble passe par une fonction serveur réservée à l'équipe.

**Jamais de contenu** : aucun texte qu'elle a écrit, aucun mot d'humeur, aucune réponse. Seulement le fait qu'une action a eu lieu, et quand.

Types à enregistrer :

- parcours : `questionnaire_commence`, `questionnaire_termine`, `carte_vue`, `chemin_commence` ;
- semaine : `semaine_ouverte`, `contenu_ouvert`, `contenu_ecoute` (« J'ai écouté »), `carnet_ecrit`, `avis_donne` (avec le choix dans `cle` : parle, pas_mal, moyen…, c'est un choix, pas un texte), `exercice_cree`, `exercice_jour_note`, `exercice_termine`, `fil_lu` (« Tirer le fil »), `semaine_terminee`, `palier_fait` ;
- rituel : `humeur_notee`, `question_cherie_repondue`, `echo_repondu`, `article_ouvert` ;
- visite : `visite` (une par jour et par utilisatrice au plus, à l'ouverture de Mon chemin) ;
- test : `surprise_vue`, `buddy_acceptee`, `buddy_refusee`, `buddy_reponse`.

Un petit utilitaire serveur `noter(type, …)` appelé depuis les actions existantes. Un échec d'enregistrement ne doit jamais bloquer l'action de l'utilisatrice.

### La page de l'équipe

Nouvelle page `/equipe` (ou le nom déjà utilisé s'il existe une page d'équipe), réservée aux adresses de la liste d'accès de l'équipe (variable d'environnement, par exemple `EQUIPE_EMAILS`). Les autres reçoivent une page 404.

Elle montre, simplement, sans bibliothèque de graphiques lourde :

- **L'entonnoir** : combien ont commencé le questionnaire, l'ont terminé, ont vu leur carte, ont commencé le chemin, ont ouvert la semaine 1, 2, 3… avec le pourcentage qui passe d'une étape à la suivante.
- **Dans une semaine** : sur celles qui l'ont ouverte, combien ont écouté, écrit dans le carnet, créé l'exercice, terminé l'exercice, lu « Tirer le fil ».
- **Le décrochage** : combien n'ont rien fait depuis 7 jours, 14 jours, et à quelle semaine elles en étaient.
- **Le rythme** : nombre médian de jours entre deux semaines, nombre moyen de jours avec une visite sur les 7 derniers jours.
- **Le rituel** : part des jours de visite où l'humeur est notée, la question chérie répondue, l'article ouvert.
- **Les avis** : répartition des choix par contenu (nombre de « ça m'a parlé », « moyen »…), pour repérer les contenus qui ne marchent pas.

Règle de confidentialité : uniquement des totaux. Pendant le test (moins de 5 comptes), afficher quand même les chiffres, avec la mention « phase de test ». Après le lancement, ne pas afficher un chiffre qui porte sur moins de 5 personnes. Jamais de nom, jamais d'adresse, jamais de lien vers un compte.

Ajouter une ligne dans la page de confidentialité : « Nous comptons les étapes franchies (jamais ce que tu écris) pour améliorer le parcours. »

## 2. La surprise, « comme si »

En test, on ne peut rien envoyer par la poste et aucun partenariat n'est signé. On montre donc ce qu'une vraie cliente recevrait, en le disant clairement.

- **Quand** : au dixième jour du chemin (milieu de la semaine 2), sans l'annoncer. En haut de Mon chemin, une carte à grain qui apparaît en montant : « Une surprise pour toi. » avec un bouton « Ouvrir ».
- **Ce qu'elle ouvre** : une page `/surprise` avec, en tête, un bandeau discret : « Phase de test. Si tu étais déjà cliente, voici ce que tu recevrais chez toi cette semaine. »
  - une enveloppe qui s'ouvre (animation courte) sur une carte postale. Pour l'instant, une image de substitution dans la charte ; l'illustration viendra de Stéphanie (`public/images/surprise-carte.jpg`) ;
  - au dos de la carte, quelques lignes signées « Présente ! » (pas un prénom : l'équipe ne lit pas les réponses). Texte fixe, pas d'IA : « Dix jours que tu es en chemin. On ne sait pas ce que tu as écrit, et c'est très bien comme ça. On sait seulement que tu es revenue. Voici de quoi continuer. » ;
  - deux ou trois avantages partenaires présentés comme des exemples : chaque carte porte la mention « exemple, partenariat à confirmer ». Les lire dans une liste en constante (`lib/surprise/avantages.ts`) pour que Cloé puisse les changer : « Un carnet à moitié prix pour écrire à la main », « Un mois offert à une newsletter sur l'argent », « Une entrée offerte à une soirée Liberté, Chérie ! ». Ne citer aucune marque tant que Cloé ne l'a pas demandé.
- Une fois ouverte, la surprise reste accessible depuis Mon chemin (un petit lien « Ma surprise »).
- Après le lancement, le bandeau « phase de test » et les mentions « exemple » disparaîtront : prévoir un seul interrupteur (`MODE_TEST`).

## 3. La buddy de test

But : essayer le parcours de mise en relation avant d'avoir de vraies promotions. Pendant le test, la buddy est un profil fictif, toujours signalé comme tel.

### Le déroulé (celui qu'on gardera avec de vraies personnes)

1. **La proposition, au quatorzième jour** (ouverture de la semaine 3) : une carte sur Mon chemin, « Envie de faire un bout de chemin à deux ? ». Deux boutons : « Oui, présentez-moi quelqu'un » et « Pas maintenant » (la proposition revient une fois, au début du mois 2, puis plus jamais).
2. **Si oui** : elle écrit une phrase de présentation (« Ce qui m'amène ici, en une phrase ») et choisit ce qu'elle accepte de montrer : son prénom, sa quête du moment. Rien d'autre n'est jamais partagé : ni son carnet, ni son journal, ni sa carte.
3. **La rencontre** : une page `/buddy` montre l'autre : prénom, quête, sa phrase de présentation.
4. **Une question par semaine, la même pour les deux**, par exemple « Qu'est-ce que tu as osé cette semaine, même petit ? ». Chacune répond en quelques lignes. **La réponse de l'autre ne s'affiche que quand on a soi-même répondu.** C'est ce qui règle le décalage : pas besoin d'être au même jour ni de se répondre en direct.
5. **Sortir à tout moment** : un lien « Arrêter l'échange », sans justification. L'autre voit seulement « L'échange s'est arrêté. ».
6. Pas de messagerie libre, pas d'échange de coordonnées par le site dans cette version.

### Les règles d'association (à écrire dans le code, non utilisées en test)

- sur accord des deux uniquement ;
- pas avant le quatorzième jour ;
- on associe par étape plutôt que par date : même mois du chemin, même quête si possible, à une semaine d'écart au plus ; sinon elle attend, avec le message « On te présente quelqu'un dès qu'une femme en est au même point que toi. ».

### En test

- La buddy est un profil fictif écrit à l'avance, dans `lib/buddy/profil-test.ts` : « Inès », même quête que la testeuse, une phrase de présentation, et quatre réponses toutes faites aux quatre premières questions de la semaine. Pas d'IA en direct.
- Partout où elle apparaît, la mention « Profil de test : Inès n'existe pas. » reste visible.
- Ses réponses s'affichent dès que la testeuse a répondu.
- Questions de la semaine et textes d'Inès : mettre des textes provisoires sobres, Cloé les réécrira.

## Le panneau de test

Pour que Cloé et Stéphanie n'attendent pas dix ou quatorze jours : sur Mon chemin, pour les comptes de la liste d'accès de l'équipe seulement, un petit bloc replié « Mode test » avec trois liens : « Ouvrir la suite maintenant », « Déclencher la surprise », « Proposer la buddy ». Invisible pour toute autre personne.

## Ordre de travail

1. La mesure de l'engagement et la page de l'équipe.
2. Le panneau de test et la surprise.
3. La buddy de test.
