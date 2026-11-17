-- Présente! V0 : schéma initial
-- À lancer une seule fois dans Supabase : SQL Editor > New query > coller ce fichier > Run.
--
-- Règle absolue : chaque utilisatrice ne voit que ses propres lignes (Row Level Security).
-- Aucune politique ne donne accès aux lignes d'une autre personne, ni au rôle « anon ».

-- ---------------------------------------------------------------------------
-- Outils communs
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles : prénom, âge, code postal, temps par semaine, formats, sujets à éviter
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  age smallint check (age is null or age between 12 and 120),
  code_postal text check (code_postal is null or code_postal ~ '^[0-9A-Za-z -]{2,10}$'),
  -- 5.1 : '30min' | '1h' | '2h_plus'
  temps_par_semaine text check (temps_par_semaine in ('30min', '1h', '2h_plus')),
  -- 5.2 : deux au plus parmi 'ecouter' | 'lire' | 'regarder' | 'faire'
  formats_preferes text[] not null default '{}'
    check (
      cardinality(formats_preferes) <= 2
      and formats_preferes <@ array['ecouter', 'lire', 'regarder', 'faire']::text[]
    ),
  -- 5.3 : texte libre, jamais transmis au moteur autrement que pour l'exclure
  sujets_a_eviter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Un profil vide est créé automatiquement à la création du compte.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- questionnaire_responses : une ligne par partie, en jsonb, avec la date.
-- « passage » garde l'historique : 1 = questionnaire d'entrée, 2 = repassé en fin de chemin.
-- ---------------------------------------------------------------------------

create table public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  passage smallint not null default 1 check (passage >= 1),
  partie smallint not null check (partie between 1 and 5),
  reponses jsonb not null default '{}'::jsonb,
  terminee boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, passage, partie)
);

create trigger questionnaire_responses_updated_at
  before update on public.questionnaire_responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- paths : les 3 quêtes dans l'ordre, leurs 2 capacités, les 3 mondes,
-- la date de début, la semaine en cours.
-- ---------------------------------------------------------------------------

create table public.paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- ex. ["argent", "voix", "liens"], dans l'ordre mois 1, 2, 3
  quetes text[] not null check (cardinality(quetes) = 3),
  -- ex. {"argent": ["AR3", "AR1"], "voix": ["VO1", "VO2"], "liens": ["LI6", "LI1"]}
  capacites jsonb not null default '{}'::jsonb,
  -- ex. ["histoire", "philosophie_pratique", "attention_reseaux"]
  mondes text[] not null check (cardinality(mondes) = 3),
  date_debut date not null default current_date,
  semaine_en_cours smallint not null default 1 check (semaine_en_cours between 1 and 12),
  -- un seul chemin actif à la fois ; les anciens restent pour l'historique (échange de quête…)
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index paths_un_seul_actif on public.paths (user_id) where actif;

create trigger paths_updated_at
  before update on public.paths
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- generated_texts : chaque texte écrit par le moteur, avec son emplacement,
-- pour ne pas le régénérer à chaque visite.
-- ---------------------------------------------------------------------------

create table public.generated_texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path_id uuid references public.paths (id) on delete cascade,
  -- 'carte_pourquoi' | 'avant_contenu' | 'avant_episode' | 'intro_exercice' | 'intro_acte' | 'palier'
  emplacement text not null check (
    emplacement in ('carte_pourquoi', 'avant_contenu', 'avant_episode', 'intro_exercice', 'intro_acte', 'palier')
  ),
  -- précise l'emplacement : la quête, la semaine, l'épisode… ex. 'argent', 's1', 'histoire-ep1'
  cle text not null default '',
  texte text not null,
  -- 'ok' = écrit et validé par la seconde passe ; 'secours' = texte générique de secours
  statut text not null default 'ok' check (statut in ('ok', 'secours')),
  -- empreinte des réponses utilisées : si elle change, le texte est réécrit
  empreinte_sources text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index generated_texts_emplacement
  on public.generated_texts (user_id, coalesce(path_id, '00000000-0000-0000-0000-000000000000'::uuid), emplacement, cle);

create trigger generated_texts_updated_at
  before update on public.generated_texts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- carnet_entries : chaque réponse de carnet, de mini-questionnaire, d'exercice et d'acte,
-- avec la semaine et la question.
-- ---------------------------------------------------------------------------

create table public.carnet_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path_id uuid references public.paths (id) on delete cascade,
  semaine smallint not null check (semaine between 1 and 12),
  type text not null check (type in ('carnet', 'mini_questionnaire', 'exercice', 'acte', 'palier')),
  -- code stable de la question (ex. 'argent-s1-q2'), pour retrouver la réponse
  question_code text,
  -- le texte de la question tel qu'elle l'a vu
  question text not null,
  reponse text not null default '',
  -- « ça m'a parlé » | « pas maintenant » | « pas pour moi »
  retour text check (retour in ('parle', 'pas_maintenant', 'pas_pour_moi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carnet_entries_user_semaine on public.carnet_entries (user_id, semaine);

create trigger carnet_entries_updated_at
  before update on public.carnet_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- moods : le « comment tu vas aujourd'hui »
-- ---------------------------------------------------------------------------

create table public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  humeur text not null,
  created_at timestamptz not null default now()
);

create index moods_user_date on public.moods (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security : partout, et seulement « ses propres lignes ».
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.paths enable row level security;
alter table public.generated_texts enable row level security;
alter table public.carnet_entries enable row level security;
alter table public.moods enable row level security;

-- Aucun accès pour les visiteuses non connectées.
revoke all on public.profiles, public.questionnaire_responses, public.paths,
  public.generated_texts, public.carnet_entries, public.moods from anon;

-- profiles (la ligne est créée par le trigger, on ne la supprime qu'avec le compte)
create policy "profil : lire le sien" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profil : modifier le sien" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- questionnaire_responses
create policy "questionnaire : lire les siennes" on public.questionnaire_responses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "questionnaire : ajouter les siennes" on public.questionnaire_responses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "questionnaire : modifier les siennes" on public.questionnaire_responses
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "questionnaire : supprimer les siennes" on public.questionnaire_responses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- paths
create policy "chemin : lire le sien" on public.paths
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "chemin : ajouter le sien" on public.paths
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chemin : modifier le sien" on public.paths
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chemin : supprimer le sien" on public.paths
  for delete to authenticated using ((select auth.uid()) = user_id);

-- generated_texts
create policy "textes : lire les siens" on public.generated_texts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "textes : ajouter les siens" on public.generated_texts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "textes : modifier les siens" on public.generated_texts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "textes : supprimer les siens" on public.generated_texts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- carnet_entries
create policy "carnet : lire les siennes" on public.carnet_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "carnet : ajouter les siennes" on public.carnet_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "carnet : modifier les siennes" on public.carnet_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "carnet : supprimer les siennes" on public.carnet_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- moods
create policy "humeur : lire les siennes" on public.moods
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "humeur : ajouter les siennes" on public.moods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "humeur : supprimer les siennes" on public.moods
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Une ligne de chemin, de texte ou de carnet ne peut pointer que vers un chemin de la même personne.
create or replace function public.check_path_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.path_id is not null and not exists (
    select 1 from public.paths p where p.id = new.path_id and p.user_id = new.user_id
  ) then
    raise exception 'path_id ne correspond pas à cette utilisatrice';
  end if;
  return new;
end;
$$;

create trigger generated_texts_path_owner
  before insert or update on public.generated_texts
  for each row execute function public.check_path_owner();

create trigger carnet_entries_path_owner
  before insert or update on public.carnet_entries
  for each row execute function public.check_path_owner();
