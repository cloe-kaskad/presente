-- Présente! V0.5 : le rituel du jour dans « Mon espace »

-- 1. L'humeur avec une phrase, une par jour (modifiable dans la journée).
alter table public.moods add column if not exists note text;
alter table public.moods add column if not exists jour date;
update public.moods set jour = (created_at at time zone 'Europe/Paris')::date where jour is null;
-- S'il y en avait plusieurs le même jour, on garde la plus récente.
delete from public.moods a using public.moods b
  where a.user_id = b.user_id and a.jour = b.jour
    and (a.created_at < b.created_at or (a.created_at = b.created_at and a.id < b.id));
alter table public.moods alter column jour set default (now() at time zone 'Europe/Paris')::date;
alter table public.moods alter column jour set not null;
create unique index if not exists moods_un_par_jour on public.moods (user_id, jour);
drop policy if exists "humeur : modifier les siennes" on public.moods;
create policy "humeur : modifier les siennes" on public.moods
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2. Le résumé de la semaine du journal, écrit par le moteur.
alter table public.generated_texts drop constraint if exists generated_texts_emplacement_check;
alter table public.generated_texts add constraint generated_texts_emplacement_check check (
  emplacement in (
    'carte_synthese', 'carte_pourquoi', 'capacite', 'monde_accroche', 'monde_pourquoi',
    'avant_contenu', 'avant_episode', 'intro_exercice', 'intro_acte', 'palier', 'journal_semaine'
  )
);

-- 3. La Question Chérie : son choix de la recevoir (l'inscription réelle sera branchée plus tard).
alter table public.profiles add column if not exists newsletter boolean not null default false;
