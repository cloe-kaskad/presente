-- Présente! V0.3 : les textes de la carte écrits par le moteur, et l'écran « Quand ça ne va pas »

-- Nouveaux emplacements : la synthèse, les capacités reformulées, l'accroche et le « pourquoi » de chaque monde.
alter table public.generated_texts drop constraint if exists generated_texts_emplacement_check;
alter table public.generated_texts add constraint generated_texts_emplacement_check check (
  emplacement in (
    'carte_synthese', 'carte_pourquoi', 'capacite', 'monde_accroche', 'monde_pourquoi',
    'avant_contenu', 'avant_episode', 'intro_exercice', 'intro_acte', 'palier'
  )
);

-- Si ses réponses montrent une détresse forte : elle voit « Quand ça ne va pas », le moteur n'écrit plus rien.
alter table public.profiles add column if not exists detresse_le timestamptz;
