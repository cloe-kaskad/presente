-- Présente! V0.12 : ses mots d'humeur à elle (« + un mot »), qui restent dans sa liste.
-- Une colonne sur son profil : elle seule peut la lire et la modifier (les règles du profil s'appliquent déjà).
alter table public.profiles add column if not exists mots_humeur text[] not null default '{}';
