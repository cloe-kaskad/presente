-- Présente! V0.4 : le carnet et les quatre semaines

-- La réponse à la question « avant » rejoint le carnet.
alter table public.carnet_entries drop constraint if exists carnet_entries_type_check;
alter table public.carnet_entries add constraint carnet_entries_type_check check (
  type in ('avant', 'carnet', 'mini_questionnaire', 'exercice', 'acte', 'palier')
);

-- Une réponse par question et par semaine : la sauvegarde automatique la remplace.
create unique index if not exists carnet_entries_question
  on public.carnet_entries (user_id, semaine, question_code);

-- Où elle en est dans chaque semaine : {"1": 3} = semaine 1, étape 3 ouverte.
alter table public.paths add column if not exists progression jsonb not null default '{}'::jsonb;
