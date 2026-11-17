-- Présente! V0 : reprise du questionnaire
-- À lancer une seule fois dans Supabase : SQL Editor > New query > coller ce fichier > Run.

-- L'écran où elle s'est arrêtée, pour reprendre au même endroit (ex. 'p2:argent').
alter table public.profiles add column if not exists questionnaire_etape text;
-- Le moment où elle a fini le questionnaire d'entrée.
alter table public.profiles add column if not exists questionnaire_termine_le timestamptz;
