-- « Ce contenu, pour toi ? » : ajout de « pas mal », entre « ça m'a parlé » et « moyen ».
alter table public.carnet_entries drop constraint if exists carnet_entries_retour_check;
alter table public.carnet_entries add constraint carnet_entries_retour_check
  check (retour in ('parle', 'pas_mal', 'moyen', 'pas_maintenant', 'pas_pour_moi'));
