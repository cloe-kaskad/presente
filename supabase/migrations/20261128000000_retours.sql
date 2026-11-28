-- V0.13 : les retours des testeuses, pointés sur la page (« Un retour ? »).
-- Elle seule écrit ses retours ; elle ne peut pas les relire. Seule l'équipe les lit, par le serveur (clé administrateur).
create table if not exists public.retours (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prenom text check (char_length(prenom) <= 80),
  page_url text not null check (char_length(page_url) <= 300),
  page_titre text check (char_length(page_titre) <= 200),
  x_pct numeric(5,2) check (x_pct between 0 and 100),
  y_pct numeric(5,2) check (y_pct between 0 and 100),
  element_texte text check (char_length(element_texte) <= 120),
  toute_la_page boolean not null default false,
  ecran_largeur integer,
  ecran_hauteur integer,
  appareil text check (appareil in ('telephone', 'ordinateur')),
  semaine smallint check (semaine between 1 and 12),
  etape text check (char_length(etape) <= 80),
  types text[] not null default '{}',
  texte text not null check (char_length(texte) between 1 and 4000),
  image_path text check (char_length(image_path) <= 200),
  traite boolean not null default false,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists retours_date_idx on public.retours (created_at desc);

alter table public.retours enable row level security;
drop policy if exists "retours : écrire les siens" on public.retours;
create policy "retours : écrire les siens" on public.retours
  for insert to authenticated with check (user_id = auth.uid());
-- Aucune lecture, modification ni suppression par l'utilisatrice : la page de l'équipe passe par le serveur.

-- Les images jointes : un espace de stockage privé (aucun accès public, aucune règle pour le navigateur).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('retours', 'retours', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic'])
on conflict (id) do nothing;
