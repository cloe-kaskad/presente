# Brief Claude Code V0.6 : retours d'usage (contenu, exercice, avis, attente)

Cloé a terminé son premier contenu sur le site (un podcast, les questions, l'exercice). Voici ce qu'elle veut changer. Mêmes règles que les briefs précédents : une étape à la fois, pousser sur main, lui dire quoi tester en mots simples, lui donner le SQL prêt à copier.

## Les maquettes font foi

Même palette, mêmes typographies, mêmes composants que l'existant. Suivre de près :

| Écran | Mobile | Ordinateur |
| --- | --- | --- |
| Un contenu, avant l'exercice | `design/Contenu-avant.html` | `design/D-Contenu-avant.html` |
| Le même contenu, exercice créé | `design/Contenu-apres.html` | `design/D-Contenu-apres.html` |
| L'exercice, pas commencé | `design/Exercice-debut.html` | (même logique) |
| L'exercice, en cours | `design/Exercice-en-cours.html` | `design/D-Exercice-en-cours.html` |
| L'exercice, terminé | `design/Exercice-fini.html` | `design/D-Exercice-fini.html` |
| Mes exercices en cours, les trois cas | `design/Exercices-etats.html` | `design/D-Exercices-etats.html` |
| Mon espace, avec la zone d'exercices | `design/Chemin.html` | `design/D-Chemin.html` |
| Une page qui charge | `design/Attente-page.html` | (même logique) |
| Pendant que l'exercice s'écrit | `design/Attente-creation.html` | (même logique) |

Les lignes grises « Note de maquette » sont des explications pour Cloé : ne pas les coder. Les textes d'exercice et les notes des sept jours sont des exemples : garder les vrais contenus d'Airtable et du moteur.

Les anciennes maquettes `Semaine-quete` et `Exercice` ont été retirées du dossier.

## 1. L'exercice devient une page à part

Aujourd'hui l'exercice (ou le geste) s'ouvre sous le contenu, dans `app/semaine/[n]/SemaineQuete.tsx`.

- Nouvelle adresse : `/semaine/[n]/exercice`. Elle porte tout ce qui est aujourd'hui dans la section 4 de `SemaineQuete` (exercice « Ouvrir » des semaines 1, geste « Agir » des semaines 3). Même adresse pour les deux, seuls les libellés changent (« Exercice » / « Dans ta vraie vie, cette semaine »).
- Sur la page du contenu, après le carnet, le bouton « Vers ton exercice » (ou « Vers ton geste ») crée l'exercice s'il n'existe pas, puis ouvre cette page. Le bouton reste accessible même si aucun avis n'est choisi et si aucune question n'est remplie.
- En haut de la page de l'exercice : « ← Mon chemin » à gauche ; à droite, un rappel discret « Après le podcast « … » · revoir le contenu » (lien vers `/semaine/[n]`).
- Sur la page du contenu, une fois l'exercice créé : un bloc court tout en haut, « Ton exercice : <nom> · <état> » avec « Reprendre » (ou « Commencer » s'il n'est pas commencé, « Relire » s'il est terminé).
- Trois états, à stocker (colonne `etat` sur la ligne de l'exercice, ou déduit) : pas commencé, en cours, terminé.
  - Pas commencé : la consigne, un bouton « Commencer ».
  - En cours : la saisie du moment en premier, puis « Ce que tu as déjà noté », puis la consigne. Pour un exercice sur plusieurs jours (rythme du type « Une semaine »), une entrée par jour et la petite barre d'avancement ; pour un exercice en une fois, un seul bloc de saisie.
  - Terminé : « Ce que tu en retiens » (une ligne libre), tout ce qu'elle a noté, « Retour à mon chemin » et « Voir dans mon carnet ». Tout reste rangé dans le carnet comme aujourd'hui.

## 2. « Mon chemin » : mes exercices en cours

- Sur `/chemin`, juste sous le bandeau et avant « Ton chemin, cette semaine. », une zone « Mes exercices en cours. ».
- Une carte par exercice créé et non terminé : la durée (le rythme, par exemple « Une semaine »), le titre, la barre d'avancement, où elle en est (« Jour 3 sur 7 », « Pas commencé »), et « Reprendre » ou « Commencer ». Toute la carte est un lien direct vers `/semaine/[n]/exercice`.
- Trois cas : aucun (un cadre en pointillés, « Aucun exercice en cours. Le prochain arrive après ton contenu de la semaine. »), un seul, plusieurs (grille de trois sur ordinateur, empilés sur mobile).
- Les exercices terminés : un lien « Exercices terminés (n) » à droite du titre, qui déplie la liste (titre, date de fin, « relire »). Masquer le lien s'il n'y en a aucun.

## 3. Les questions après un contenu

- Version courte, pour tous les contenus : « La phrase que tu as envie de noter. » et « À qui as-tu pensé en écoutant ? ».
- Version longue : les deux mêmes, plus « Dans ton corps, où est-ce que ça a réagi ? ». Elle n'apparaît que si le contenu a l'intensité « bousculante » dans Airtable (le champ d'intensité déjà lu par `lib/catalogue/airtable.ts`), ou à partir du mois 3 du chemin. C'est Cloé qui marque les contenus : ne rien deviner d'autre.
- Retirer cette question du gabarit par défaut dans `lib/semaines/contenu.ts`, et l'ajouter par cette règle.
- Aucune question n'est obligatoire. Le dire sous le titre : « Rien n'est obligatoire. Écris ce qui vient, laisse le reste vide. » Aucun champ `required`, aucun blocage.

## 4. « Ce contenu, pour toi ? » : quatre choix et un mot

- Quatre choix, un seul possible (`role="radiogroup"`), le choisi bien visible (fond bordeaux) : « ça m'a parlé », « moyen », « pas maintenant », « pas pour moi ». Ajouter `moyen` à `RETOURS` dans `lib/semaines/etiquettes.ts` et à la contrainte en base s'il y en a une (donner le SQL à Cloé).
- Sous les choix, replié derrière « + Ajouter un mot » : un champ libre facultatif, « Dis-moi pourquoi, ça m'aide à mieux choisir la suite », avec le texte d'aide « Par exemple : je n'accroche pas avec cette autrice, trop court, trop théorique. ». Nouvelle colonne texte à côté du retour.
- Après l'envoi, une ligne : « C'est noté. On en tient compte pour choisir tes prochains contenus. »
- Que ce soit vrai : dans `lib/catalogue/choix.ts`, « moyen » compte comme un signal faible (moins bien noté que « ça m'a parlé », mieux que « pas pour moi »). Le mot libre est passé au moteur seulement comme contexte pour le choix suivant ; il n'est jamais affiché ailleurs que dans son carnet, et jamais dans les logs.

## 5. Les phrases inspirantes ne sont plus un écran d'attente

- Supprimer `<Mantra />` de tous les `loading.tsx` (`app/chemin`, `app/journal`, `app/semaine/[n]`). À la place, chaque page affiche sa propre structure en attente (blocs rose grisé aux formes de la page, `aria-busy`), comme dans `design/Attente-page.html`.
- Pendant que le moteur écrit l'exercice (et le palier) : plus de citation. Un écran qui dit ce qui se passe, comme `design/Attente-creation.html` : le titre « On écrit ton exercice. », trois étapes (« On relit ce que tu viens de noter », « On l'écrit avec tes mots », « On le range dans ton chemin »), et « Une dizaine de secondes. Tu peux rester ici. »
- Les citations ne restent qu'à trois moments, dans la page, en bloc à grain, jamais en plein écran :
  1. à la fin d'un contenu (après l'envoi de l'avis) ;
  2. quand un exercice est terminé ;
  3. à la première ouverture de la journée : c'est la citation du jour, en haut de « Mon espace ».
- L'écran `/bienvenue` (juste après « Commencer mon chemin ») ne change pas : c'est un moment choisi, une seule fois.
- Toujours la liste de `components/Mantra.tsx` (citations de femmes avec leur nom). Ne pas en ajouter.

## Ordre de travail

1. Les phrases inspirantes hors des transitions (point 5). C'est le plus gênant à l'usage.
2. L'exercice sur sa propre page, avec ses trois états (point 1).
3. « Mes exercices en cours » dans Mon chemin (point 2).
4. Les questions courtes et longues, puis l'avis à quatre choix (points 3 et 4).
