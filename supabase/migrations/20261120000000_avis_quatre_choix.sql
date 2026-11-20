-- V0.6 : « Ce contenu, pour toi ? » passe à quatre choix (ajout de « moyen »).
-- Le mot libre facultatif est rangé dans la colonne « reponse » de la même ligne de carnet : aucune colonne ajoutée.
alter table public.carnet_entries drop constraint if exists carnet_entries_retour_check;
alter table public.carnet_entries add constraint carnet_entries_retour_check
  check (retour in ('parle', 'moyen', 'pas_maintenant', 'pas_pour_moi'));
