# Brief Claude Code V0.13 : des questions propres à chaque contenu, le fil d'Ariane, la transcription automatique

Trois chantiers issus de la présentation à Stéphanie (27 novembre). Ils sont indépendants : les faire dans cet ordre, une étape à la fois, pousser sur main, dire à Cloé quoi tester en mots simples.

## 1. Des questions propres à chaque contenu

Aujourd'hui, après un contenu, les questions sont les mêmes pour tous (« La phrase que tu as envie de noter », « À qui as-tu pensé ? »). Pour 15 podcasts, Claude (côté design) a écrit des questions à partir de la transcription, dans trois nouveaux champs de la table des contenus hors médiathèque (`tblVAGua7hcNY49W1`) :

| Champ | Identifiant | Contenu |
|---|---|---|
| P! Ce qu'on y entend | `fldLLq2FIdntJpZMB` | Deux ou trois phrases sur l'épisode |
| P! Question avant | `fld0ojHPfDdSKQpQX` | Une question, avant l'écoute |
| P! Questions après | `flddxGcbsV5eKrRHi` | Deux questions, une par ligne |
| Transcription disponible | `fldAx8kaUXbgzFTVy` | Oui, Non, À vérifier (pour information) |

Règles d'affichage :

- **« Ce qu'on y entend »** : quand le champ est rempli, il s'affiche sur la carte du contenu à la place du texte « pourquoi ce contenu » actuel, et il est donné au moteur d'écriture comme contexte (jamais la transcription elle-même).
- **La question d'avant** : en semaine 1 d'une quête, si le contenu a sa propre question, elle remplace la question générale de la quête. Elle est enregistrée sous le même code, pour que tout ce qui s'appuie dessus continue de marcher. En semaine 3, on garde la question de retour en arrière (« Il y a deux semaines… ») : c'est elle qui fait le lien.
- **Les questions d'après** : si le contenu a ses deux questions, elles remplacent « La phrase que tu as envie de noter ». « À qui as-tu pensé ? » reste toujours, en dernier, parce qu'elle sert à adapter la suite. Aucune n'est obligatoire.
- Champ vide : rien ne change, les questions générales s'affichent.
- Les mêmes trois champs sont à prévoir pour la table de la médiathèque, mais ne rien y écrire : Cloé n'a autorisé que le champ « P! Temps » dans cette table. Si un contenu de la médiathèque a besoin de questions, le lui dire.

## 2. Le fil d'Ariane, plus lisible

Retour de Stéphanie : on ne voit pas assez où on en est, ni dans quel ordre faire les choses. Maquettes : `design/Fil-chemin.html`, `design/D-Fil-chemin.html`, `design/Fil-dedans.html`.

- **Sur Mon chemin**, le bloc « Ton chemin, cette semaine. » (la carte rouge et les trois cartes de semaines) est remplacé par :
  - une ligne de repère en trois niveaux, toujours dans cet ordre : « Mois 1 · La Voix › Semaine 3 sur 4 › Étape 3 sur 4 » ;
  - le titre de la semaine ;
  - les étapes de la semaine en liste numérotée, reliées par un trait. Faites : coche rouge, texte atténué. En cours : un bloc rose pâle « Maintenant », avec **le seul bouton plein de la page**. À venir : cercle en pointillé, « Ensuite ».
  - sous la liste, le mois en quatre segments (semaine 1 à 4), avec « faite », « en cours », ou la date d'ouverture ;
  - une phrase : « Tu peux faire les étapes dans l'ordre que tu veux. La semaine 4 s'ouvre lundi 30 novembre. »
- « Maintenant » désigne la première étape non faite. Les autres restent cliquables : l'ordre est conseillé, pas imposé.
- **Dans chaque page du chemin** (contenu, exercice, Tirer le fil, pause guidée, épisode de monde) : en haut, « ‹ Mon chemin », la ligne de repère (« La Voix › Semaine 3 › Étape 3 sur 4 ») et quatre petits segments ; en bas, un lien « Ensuite, étape 4 sur 4 : Tirer le fil ». À la dernière étape : « Retour à mon chemin ».
- La citation du jour, « Comment tu vas » et le reste de Mon chemin ne changent pas.
- Ces maquettes gardent la charte actuelle. La direction artistique va changer : coder la structure proprement, sans peaufiner les détails de style.

## 3. La transcription automatique

But : pour chaque nouveau podcast ajouté dans Airtable (un titre et un lien suffisent), obtenir son texte, puis les trois champs du point 1, sans intervention de Cloé.

**Où ça tourne.** Pas dans le site (les fichiers audio sont trop gros et trop longs à traiter pour une page web). Dans une tâche GitHub du dépôt, que Cloé peut lancer d'un clic (« Run workflow ») et qui tourne aussi chaque nuit. Le script : `scripts/preparer-contenus.ts`.

**Les clés** (à ranger dans les « Secrets » du dépôt GitHub, jamais dans le code ni dans la conversation) : `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AIRTABLE_TOKEN_ECRITURE` (un jeton Airtable limité à cette base, avec le droit d'écrire), et les accès Supabase côté serveur. Expliquer à Cloé, pas à pas, où cliquer pour les ajouter.

**Le déroulé, pour chaque contenu de type Podcast ou Vidéo dont « P! Questions après » est vide :**

1. **Chercher le texte sur la page du lien.** Les pages Ausha affichent souvent la transcription (blocs « Speaker #0 », « Speaker #1 ») : la prendre, sans les doublons. Sur 21 épisodes Ausha vérifiés le 27 novembre, 15 l'avaient.
2. **Sinon, trouver l'audio.** Dans la page (balise audio, données de la page), ou dans le flux RSS de l'émission. Si un champ « P! Lien audio » est rempli dans Airtable, l'utiliser en priorité (à créer, pour les cas où l'audio est introuvable, par exemple Spotify).
3. **Transcrire avec OpenAI.** Avant, réduire le fichier avec ffmpeg (mono, bas débit) et le couper en morceaux si besoin, car l'API refuse les gros fichiers. **Vérifier dans la documentation OpenAI du jour le modèle de transcription à utiliser, la taille maximale et le prix** : ne pas se fier à sa mémoire. Langue : celle du champ « Langue » d'Airtable.
4. **Ranger la transcription dans Supabase**, table `transcriptions` (identifiant du contenu, source « page » ou « openai », texte, date), accessible au serveur seulement. Jamais dans Airtable, jamais affichée sur le site, jamais envoyée au navigateur : ces podcasts ne sont pas les nôtres.
5. **Écrire les trois champs** avec l'API Anthropic et le prompt `prompts/questions-contenu.md`. Vérifier le résultat avant d'écrire : JSON valide, longueurs respectées, pas de tiret cadratin, pas de mot interdit, aucune suite de plus de huit mots recopiée de la transcription. Sinon, une seconde tentative, puis abandon.
6. **Écrire dans Airtable** les trois champs et « Transcription disponible » (Oui si le texte venait de la page, Non sinon). Ne toucher à aucun autre champ, ne supprimer aucune ligne, ne jamais écrire dans la table de la médiathèque.
7. **Un compte rendu lisible** à la fin de la tâche : pour chaque contenu, « texte trouvé sur la page », « transcrit (durée, coût estimé) », ou « échec : audio introuvable ». En cas d'échec, ne rien écrire et passer au suivant.

**Garde-fous.** Dix contenus au plus par lancement. Un contenu déjà rempli n'est jamais réécrit, sauf si Cloé vide le champ. Un plafond de dépense par lancement, annoncé dans le compte rendu.

**Phase de test.** Les questions écrites vont directement sur le site (décision de Cloé : elle corrige après). Prévoir tout de même un champ « P! Questions : à relire » (case à cocher) rempli par le script, pour qu'elle retrouve ce qui est nouveau.
