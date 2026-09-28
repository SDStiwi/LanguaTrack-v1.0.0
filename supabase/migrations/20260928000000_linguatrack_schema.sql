-- LinguaTrack: complete database setup for Supabase (Postgres 15+). ONE file, safe to re-run.
-- Every row belongs to one teacher (teacher_id = auth.uid()); RLS enforces it.
-- Hosted: paste into SQL Editor and run. Local: applied automatically by `supabase start` / `supabase db reset`.

create extension if not exists pgcrypto;

-- ─── Tables ───────────────────────────────────────────────────────────────
create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  age_group   text,
  notes       text not null default '',
  archived_at timestamptz,                      -- archived students are hidden but keep their results
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.students add column if not exists archived_at timestamptz;  -- upgrades from older installs

-- Teacher-written questions that are mixed into that teacher's tests.
create table if not exists public.custom_questions (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book        text not null check (book in ('kids', 'teen-adult')),
  unit_id     text not null,
  level       text not null check (level in ('Pre-A1','A1','A2','B1','B2','C1')),
  skill       text not null check (skill in ('Grammar','Vocabulary','Reading','Everyday English')),
  question    text not null check (length(trim(question)) > 0),
  options     jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer      smallint not null check (answer between 0 and 3),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists custom_questions_teacher_idx on public.custom_questions (teacher_id);

create table if not exists public.assessments (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  client_id        text not null,                       -- device-generated id: makes retries idempotent
  type             text not null check (type in ('initial', 'progress')),
  title            text,
  score            numeric,
  estimated_level  text,
  confidence       text,
  start_unit_id    text,
  skills           jsonb,
  levels           jsonb,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (teacher_id, client_id)
);

create table if not exists public.assessment_answers (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assessment_id    uuid not null references public.assessments(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  question_id      text not null,
  selected_answer  int,
  is_correct       boolean not null default false,
  level            text,                                -- snapshot of question metadata
  skill            text,
  unit_id          text,
  created_at       timestamptz not null default now()
);

create table if not exists public.unit_progress (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  unit_id     text not null,
  stars       smallint not null default 0 check (stars between 0 and 3),
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (student_id, unit_id)
);

create index if not exists assessments_student_idx        on public.assessments (student_id);
create index if not exists assessments_teacher_idx        on public.assessments (teacher_id);
create index if not exists answers_assessment_idx         on public.assessment_answers (assessment_id);
create index if not exists answers_teacher_question_idx   on public.assessment_answers (teacher_id, question_id);
create index if not exists unit_progress_teacher_idx      on public.unit_progress (teacher_id);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists students_touch on public.students;
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────
alter table public.students           enable row level security;
alter table public.assessments        enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.unit_progress      enable row level security;
alter table public.custom_questions   enable row level security;

drop policy if exists students_own on public.students;
create policy students_own on public.students
  for all to authenticated
  using      (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

drop policy if exists assessments_own on public.assessments;
create policy assessments_own on public.assessments
  for all to authenticated
  using      (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.students s where s.id = student_id and s.teacher_id = (select auth.uid()))
  );

drop policy if exists answers_own on public.assessment_answers;
create policy answers_own on public.assessment_answers
  for all to authenticated
  using      (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.assessments a where a.id = assessment_id and a.teacher_id = (select auth.uid()))
  );

drop policy if exists progress_own on public.unit_progress;
create policy progress_own on public.unit_progress
  for all to authenticated
  using      (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.students s where s.id = student_id and s.teacher_id = (select auth.uid()))
  );

drop policy if exists questions_own on public.custom_questions;
create policy questions_own on public.custom_questions
  for all to authenticated
  using      (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

-- No policies for `anon`: a signed-out visitor gets zero rows.

-- ─── Per-question statistics (Insights page) ──────────────────────────────
-- security_invoker makes the view obey the caller's RLS, so a teacher only sees their own answers.
create or replace view public.question_stats
with (security_invoker = true) as
select
  question_id,
  max(level)                          as level,
  max(skill)                          as skill,
  count(*)::int                       as n,
  count(*) filter (where is_correct)::int as correct
from public.assessment_answers
group by question_id;

-- ─── submit_assessment: assessment + answers in ONE transaction ───────────
-- Idempotent on (teacher_id, client_id): a retry after a lost response returns the
-- existing assessment id instead of creating a duplicate. SECURITY INVOKER, so RLS applies.
create or replace function public.submit_assessment(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_client_id text := p_payload->>'client_id';
  v_a         jsonb := p_payload->'assessment';
  v_id        uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if v_client_id is null or v_a is null then
    raise exception 'Invalid payload' using errcode = '22023';
  end if;

  insert into public.assessments (
    teacher_id, student_id, client_id, type, title, score, estimated_level, confidence,
    start_unit_id, skills, levels, started_at, completed_at
  ) values (
    v_uid, (v_a->>'student_id')::uuid, v_client_id, v_a->>'type', v_a->>'title',
    nullif(v_a->>'score', '')::numeric, v_a->>'estimated_level', v_a->>'confidence',
    v_a->>'start_unit_id',
    case when jsonb_typeof(v_a->'skills') = 'null' then null else v_a->'skills' end,
    case when jsonb_typeof(v_a->'levels') = 'null' then null else v_a->'levels' end,
    nullif(v_a->>'started_at', '')::timestamptz, nullif(v_a->>'completed_at', '')::timestamptz
  )
  on conflict (teacher_id, client_id) do nothing
  returning id into v_id;

  if v_id is null then                       -- already saved by an earlier attempt
    select id into v_id from public.assessments where teacher_id = v_uid and client_id = v_client_id;
    return v_id;
  end if;

  insert into public.assessment_answers (
    teacher_id, assessment_id, student_id, question_id, selected_answer, is_correct, level, skill, unit_id
  )
  select
    v_uid, v_id, (v_a->>'student_id')::uuid, x->>'question_id',
    nullif(x->>'selected_answer', '')::int, coalesce((x->>'is_correct')::boolean, false),
    x->>'level', x->>'skill', x->>'unit_id'
  from jsonb_array_elements(coalesce(p_payload->'answers', '[]'::jsonb)) as x;

  return v_id;
end $$;

revoke all on function public.submit_assessment(jsonb) from public, anon;
grant execute on function public.submit_assessment(jsonb) to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.students, public.assessments,
  public.assessment_answers, public.unit_progress, public.custom_questions to authenticated;
grant select on public.question_stats to authenticated;
