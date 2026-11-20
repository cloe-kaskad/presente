# Brief Claude Code V0.8 : les exercices qui ressortent, et du mouvement

Deux retours de Cloé sur « Mon chemin » :

1. la zone « Mes exercices en cours » ne ressort pas assez ;
2. la plateforme manque d'animation, à commencer par cette page.

Mêmes règles que d'habitude : une étape à la fois, pousser sur main, lui dire quoi tester en mots simples.

## Les maquettes font foi

- `design/Chemin.html` et `design/D-Chemin.html` : ouvre-les dans un navigateur, l'animation se joue à l'ouverture et se rejoue au survol. Le CSS des animations est dans la balise `<style>` du fichier (classes `an-…`) : le reprendre tel quel, en modules CSS.
- `design/Exercices-etats.html` et `design/D-Exercices-etats.html` : les cartes d'exercice dans les trois cas.

## 1. Les cartes d'exercice

Remplacer les cartes blanches à bordure par des cartes pleines, fond rose (`--rose`, #f7beca), coins 24 px, sans bordure :

- à gauche, un **anneau d'avancement** (fond blanc, arc rouge profond, « 2/7 » au centre) ;
- une ligne en petit rouge : « Exercice · une semaine · jour 3 sur 7 » ;
- le titre en bordeaux, 22 px (30 px quand il n'y a qu'un seul exercice sur ordinateur) ;
- **la prochaine action en clair**, précédée d'un point rouge qui pulse doucement : « Aujourd'hui : note ton oui du jour. » Le texte vient de l'exercice (sa prochaine étape) ; à défaut : « Aujourd'hui : la suite de ton exercice. » ; pour un exercice pas commencé : « Quand tu veux cette semaine. » ;
- un vrai bouton plein rouge profond : « Reprendre » ou « Commencer ».

Un seul exercice sur ordinateur : une carte large, sur toute la largeur, anneau à gauche, bouton à droite, et le titre de la zone devient « Ton exercice en cours. ». Plusieurs : une grille d'autant de colonnes que d'exercices (trois maximum par ligne). Sur mobile, les cartes s'empilent.

Toute la carte reste un lien direct vers l'exercice.

## 2. Le mouvement

Principe : une entrée orchestrée à l'ouverture de chaque page, puis presque rien. Le mouvement montre ce qui a changé ou ce qu'il y a à faire. Jamais de mouvement qui fait attendre.

Règles communes :

- durées de 200 à 700 ms, courbe `cubic-bezier(.2,.7,.2,1)` ; seul le tracé du chemin dure 1,6 s ;
- n'animer que `opacity`, `transform` et `stroke-dashoffset` ;
- `prefers-reduced-motion: reduce` : tout est coupé (la règle globale existe déjà dans `app/globals.css`, vérifier qu'elle couvre les nouvelles animations) ;
- une entrée ne se joue qu'une fois par visite de la page, pas à chaque retour d'un état React.

### « Mon chemin » (en premier)

1. La citation du jour monte et apparaît (16 px, 700 ms).
2. Le tracé du mois se dessine de gauche à droite (1,6 s), puis les points des étapes faites apparaissent l'un après l'autre (220 ms d'écart) ; le point « tu es ici » garde un halo qui respire lentement.
3. Les cartes d'exercice montent l'une après l'autre (120 ms d'écart), leur anneau se remplit (1,2 s).
4. Les cartes des semaines montent à la suite (90 ms d'écart).
5. Au survol, une carte d'exercice se soulève de 3 px avec une ombre douce.

### Partout

- **Enregistrer quelque chose** (humeur, question du jour, note d'exercice, avis) : le bouton laisse place à « C'est noté. » avec une coche qui se dessine (300 ms). Pas de rechargement visible.
- **Un jour d'exercice noté** : le segment ou l'arc de l'anneau se remplit, la nouvelle note glisse dans « Ce que tu as déjà noté ».
- **Exercice terminé / contenu terminé** : le bloc de citation à grain apparaît en montant (700 ms). C'est le seul « moment » marqué.
- **Les choix** (humeur, avis, « c'est toujours vrai ? ») : la pastille choisie se remplit en 150 ms, légère pression au clic (`scale(.97)`).
- **Champ replié** (« + Ajouter un mot », « Au début du chemin », « Exercices terminés ») : ouverture en hauteur animée (200 ms).
- **Le journal** : les pastilles du calendrier apparaissent en vague, jour après jour (15 ms d'écart).
- **Le carnet** : les notes de la semaine en cours montent en cascade (60 ms d'écart, six premières seulement).
- **La carte** (`/carte`) : la lettre « voici ce qu'on a compris » apparaît paragraphe par paragraphe (150 ms d'écart).
- **Changement de page** : un fondu très court (150 ms) avec l'API View Transitions quand le navigateur la propose. Rien sinon.
- **Boutons** : transition de couleur 150 ms au survol, déjà en place ou à ajouter.

## Ordre de travail

1. Les nouvelles cartes d'exercice et l'animation de « Mon chemin ».
2. Les retours d'enregistrement (« C'est noté. », anneau, choix).
3. Le reste (journal, carnet, carte, changement de page).
