-- Présente! V0 : les contenus et exercices choisis pour chaque semaine
-- Une fois choisis, ils ne changent plus à chaque visite.
-- Forme : {"m1s1": {"quete": "argent", "contenu": "rec…", "pratique": "rec…"}, "m1s3": {…}, …}
alter table public.paths add column if not exists choix jsonb not null default '{}'::jsonb;
