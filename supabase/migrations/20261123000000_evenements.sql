-- V0.10 : mesurer l'engagement. Une ligne par étape franchie, jamais de contenu.
-- « cle » ne porte qu'un identifiant court (un choix d'avis, l'identifiant d'un contenu), jamais un texte écrit.
create table if not exists public.evenements (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path_id uuid references public.paths (id) on delete set null,
  type text not null check (type ~ '^[a-z_]{2,40}$'),
  semaine smallint check (semaine between 1 and 12),
  cle text check (cle ~ '^[A-Za-z0-9_:.-]{1,60}$'),
  jour date not null default ((now() at time zone 'Europe/Paris')::date),
  created_at timestamptz not null default now()
);
create index if not exists evenements_user_idx on public.evenements (user_id, created_at);
create index if not exists evenements_type_idx on public.evenements (type);
-- Une seule visite par jour et par personne.
create unique index if not exists evenements_visite_unique on public.evenements (user_id, jour) where type = 'visite';

alter table public.evenements enable row level security;
drop policy if exists "evenements : écrire les siens" on public.evenements;
create policy "evenements : écrire les siens" on public.evenements
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "evenements : lire les siens" on public.evenements;
create policy "evenements : lire les siens" on public.evenements
  for select to authenticated using (user_id = auth.uid());
-- Pas de modification ni de suppression par l'utilisatrice. La vue d'ensemble passe par le serveur (page de l'équipe).
