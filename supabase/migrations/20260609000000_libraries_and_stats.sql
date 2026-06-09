-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Selectable Libraries + Workout Stats                     ║
-- ║                                                                    ║
-- ║  Moves the "selectable / shareable" entities out of per-user JSONB ║
-- ║  blobs into proper tables:                                         ║
-- ║    • workout_routines      — training programs                     ║
-- ║    • recipes               — meals / recipes                       ║
-- ║    • business_templates    — venture frameworks (blueprints)       ║
-- ║    • passion_templates     — interest / hobby trackers             ║
-- ║    • workout_personal_bests — PRs per exercise                     ║
-- ║    • workout_sessions      — logged workouts (stats history)       ║
-- ║                                                                    ║
-- ║  PATTERN: each library table has a nullable owner_id.              ║
-- ║    owner_id IS NULL  → a SHIPPED DEFAULT (visible to everyone)     ║
-- ║    owner_id = a user → something THAT user created                 ║
-- ║  Shipped rows also carry builtin_key, which maps them back to the  ║
-- ║  app's bundled default content (APP_DATA) so we don't duplicate    ║
-- ║  thousands of lines of program/recipe JSON in SQL. User-created    ║
-- ║  rows store their full payload in the JSONB columns.               ║
-- ║                                                                    ║
-- ║  Idempotent: safe to re-run (create if not exists, drop policy if  ║
-- ║  exists, seed via "where not exists").                             ║
-- ╚══════════════════════════════════════════════════════════════════╝

create extension if not exists pgcrypto;  -- for gen_random_uuid()

-- ════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ════════════════════════════════════════════════════════════════════

-- ── Workout routines (selectable training programs) ──
create table if not exists public.workout_routines (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,  -- NULL = shipped default
  builtin_key  text,            -- maps a shipped row to APP_DATA preset (e.g. 'jeff-nippard-ulppl'); NULL for custom
  name         text not null,
  eyebrow      text,
  description  text,
  icon         text,
  gradient     text,
  days_per_week int,
  duration     text,
  level        text,
  tags         jsonb default '[]'::jsonb,
  schedule     jsonb default '[]'::jsonb,   -- ['Upper','Lower','Rest',...]
  stages       jsonb default '[]'::jsonb,   -- [{name, weekCount, phase}]
  program      jsonb,                        -- full {phaseLogic, recovery, ramping, restDay} for custom routines
  is_default   boolean default false,
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Recipes (meals — selectable defaults + user-built) ──
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,
  builtin_key  text,
  name         text not null,
  category     text,            -- Simple | Premade | Gourmet
  cuisine      text,
  calories     int,
  protein      int,
  carbs        int,
  fats         int,
  ingredients  jsonb default '[]'::jsonb,    -- [{name, quantity, calories, protein, carbs, fats}]
  tags         jsonb default '[]'::jsonb,
  slot         int,             -- optional preferred slot 0-3 (breakfast..snack)
  is_default   boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Business templates (venture frameworks / blueprints) ──
create table if not exists public.business_templates (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,
  builtin_key  text,
  name         text not null,
  description  text,
  icon         text,
  steps        jsonb default '[]'::jsonb,    -- [{name, description, keyActions:[]}]
  is_default   boolean default false,
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Passion / interest templates (hobby trackers) ──
create table if not exists public.passion_templates (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,
  builtin_key  text,
  name         text not null,
  description  text,
  icon         text,
  fields       jsonb default '[]'::jsonb,    -- structure: what this interest tracks
  is_default   boolean default false,
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Personal bests (one current PR per exercise, per user) ──
create table if not exists public.workout_personal_bests (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  exercise         text not null,
  weight           numeric,
  reps             int,
  est_one_rep_max  numeric,     -- estimated 1RM (Epley etc.)
  unit             text default 'lb',
  notes            text,
  achieved_on      date default current_date,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (owner_id, exercise)
);

-- ── Workout sessions (logged workouts — the stats history) ──
create table if not exists public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  routine_id    uuid references public.workout_routines(id) on delete set null,
  day_name      text,
  phase         text,
  week_number   int,
  exercises     jsonb default '[]'::jsonb,  -- [{name, sets:[{weight,reps,rpe}]}]
  notes         text,
  duration_min  int,
  logged_at     timestamptz default now(),
  created_at    timestamptz default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ════════════════════════════════════════════════════════════════════
create index if not exists idx_routines_owner   on public.workout_routines(owner_id);
create index if not exists idx_recipes_owner     on public.recipes(owner_id);
create index if not exists idx_biz_owner         on public.business_templates(owner_id);
create index if not exists idx_passion_owner     on public.passion_templates(owner_id);
create index if not exists idx_pbs_owner         on public.workout_personal_bests(owner_id);
create index if not exists idx_sessions_owner    on public.workout_sessions(owner_id);
create index if not exists idx_sessions_logged   on public.workout_sessions(owner_id, logged_at desc);
-- Unique shipped defaults (one per builtin_key) — also makes the seed idempotent.
create unique index if not exists uniq_routines_builtin  on public.workout_routines(builtin_key) where owner_id is null;
create unique index if not exists uniq_recipes_builtin   on public.recipes(builtin_key) where owner_id is null;
create unique index if not exists uniq_biz_builtin       on public.business_templates(builtin_key) where owner_id is null;
create unique index if not exists uniq_passion_builtin   on public.passion_templates(builtin_key) where owner_id is null;

-- ════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
--    Libraries: anyone may READ shipped defaults (owner_id IS NULL) or
--    their own rows; may only WRITE their own rows.
--    Stats: strictly own rows.
-- ════════════════════════════════════════════════════════════════════
alter table public.workout_routines       enable row level security;
alter table public.recipes                 enable row level security;
alter table public.business_templates       enable row level security;
alter table public.passion_templates         enable row level security;
alter table public.workout_personal_bests  enable row level security;
alter table public.workout_sessions        enable row level security;

-- Helper note: policies are dropped first so this migration is re-runnable.

-- workout_routines
drop policy if exists "routines read"   on public.workout_routines;
drop policy if exists "routines insert" on public.workout_routines;
drop policy if exists "routines update" on public.workout_routines;
drop policy if exists "routines delete" on public.workout_routines;
create policy "routines read"   on public.workout_routines for select using (owner_id is null or owner_id = auth.uid());
create policy "routines insert" on public.workout_routines for insert with check (owner_id = auth.uid());
create policy "routines update" on public.workout_routines for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "routines delete" on public.workout_routines for delete using (owner_id = auth.uid());

-- recipes
drop policy if exists "recipes read"   on public.recipes;
drop policy if exists "recipes insert" on public.recipes;
drop policy if exists "recipes update" on public.recipes;
drop policy if exists "recipes delete" on public.recipes;
create policy "recipes read"   on public.recipes for select using (owner_id is null or owner_id = auth.uid());
create policy "recipes insert" on public.recipes for insert with check (owner_id = auth.uid());
create policy "recipes update" on public.recipes for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "recipes delete" on public.recipes for delete using (owner_id = auth.uid());

-- business_templates
drop policy if exists "biz read"   on public.business_templates;
drop policy if exists "biz insert" on public.business_templates;
drop policy if exists "biz update" on public.business_templates;
drop policy if exists "biz delete" on public.business_templates;
create policy "biz read"   on public.business_templates for select using (owner_id is null or owner_id = auth.uid());
create policy "biz insert" on public.business_templates for insert with check (owner_id = auth.uid());
create policy "biz update" on public.business_templates for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "biz delete" on public.business_templates for delete using (owner_id = auth.uid());

-- passion_templates
drop policy if exists "passion read"   on public.passion_templates;
drop policy if exists "passion insert" on public.passion_templates;
drop policy if exists "passion update" on public.passion_templates;
drop policy if exists "passion delete" on public.passion_templates;
create policy "passion read"   on public.passion_templates for select using (owner_id is null or owner_id = auth.uid());
create policy "passion insert" on public.passion_templates for insert with check (owner_id = auth.uid());
create policy "passion update" on public.passion_templates for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "passion delete" on public.passion_templates for delete using (owner_id = auth.uid());

-- workout_personal_bests (own only)
drop policy if exists "pbs read"   on public.workout_personal_bests;
drop policy if exists "pbs insert" on public.workout_personal_bests;
drop policy if exists "pbs update" on public.workout_personal_bests;
drop policy if exists "pbs delete" on public.workout_personal_bests;
create policy "pbs read"   on public.workout_personal_bests for select using (owner_id = auth.uid());
create policy "pbs insert" on public.workout_personal_bests for insert with check (owner_id = auth.uid());
create policy "pbs update" on public.workout_personal_bests for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pbs delete" on public.workout_personal_bests for delete using (owner_id = auth.uid());

-- workout_sessions (own only)
drop policy if exists "sessions read"   on public.workout_sessions;
drop policy if exists "sessions insert" on public.workout_sessions;
drop policy if exists "sessions update" on public.workout_sessions;
drop policy if exists "sessions delete" on public.workout_sessions;
create policy "sessions read"   on public.workout_sessions for select using (owner_id = auth.uid());
create policy "sessions insert" on public.workout_sessions for insert with check (owner_id = auth.uid());
create policy "sessions update" on public.workout_sessions for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sessions delete" on public.workout_sessions for delete using (owner_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 4. updated_at TRIGGERS (reuses public.update_updated_at from initial schema)
-- ════════════════════════════════════════════════════════════════════
drop trigger if exists trg_routines_updated on public.workout_routines;
create trigger trg_routines_updated before update on public.workout_routines for each row execute function public.update_updated_at();

drop trigger if exists trg_recipes_updated on public.recipes;
create trigger trg_recipes_updated before update on public.recipes for each row execute function public.update_updated_at();

drop trigger if exists trg_biz_updated on public.business_templates;
create trigger trg_biz_updated before update on public.business_templates for each row execute function public.update_updated_at();

drop trigger if exists trg_passion_updated on public.passion_templates;
create trigger trg_passion_updated before update on public.passion_templates for each row execute function public.update_updated_at();

drop trigger if exists trg_pbs_updated on public.workout_personal_bests;
create trigger trg_pbs_updated before update on public.workout_personal_bests for each row execute function public.update_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 5. SEED — SHIPPED DEFAULTS (owner_id IS NULL)
--    Lightweight rows keyed by builtin_key. The app resolves the rich
--    detail (full program / blueprint steps) from APP_DATA by builtin_key;
--    these rows make the items selectable and let users add their own.
--    Re-runnable via "where not exists".
-- ════════════════════════════════════════════════════════════════════

-- Workout routines ---------------------------------------------------------
insert into public.workout_routines (builtin_key, name, eyebrow, description, icon, gradient, days_per_week, duration, level, tags, schedule, stages, is_default, sort_order)
select 'jeff-nippard-ulppl', 'The Bodybuilding Transformation System', 'Hypertrophy · Science-Based',
  'Your 12-week Upper/Lower + Push/Pull/Legs system. Two blocks — a technique-focused Recovery phase, then a high-intensity Ramping phase that takes marked lifts to failure. Every lift carries two substitutions and detailed execution cues.',
  '🔬', 'linear-gradient(135deg, #ff6b35 0%, #c93c10 100%)', 5, '12 Weeks', 'Intermediate',
  '["Hypertrophy","Strength"]'::jsonb,
  '["Upper","Lower","Rest","Pull","Push","Legs","Rest"]'::jsonb,
  '[{"name":"Technique","weekCount":2,"phase":"recovery"},{"name":"Volume","weekCount":3,"phase":"recovery"},{"name":"Intro","weekCount":1,"phase":"ramping"},{"name":"Overload","weekCount":6,"phase":"ramping"}]'::jsonb,
  true, 0
where not exists (select 1 from public.workout_routines where builtin_key = 'jeff-nippard-ulppl' and owner_id is null);

insert into public.workout_routines (builtin_key, name, eyebrow, description, icon, gradient, days_per_week, duration, level, tags, schedule, stages, is_default, sort_order)
select 'classic-ppl', 'Classic PPL', 'Strength · Volume',
  'The timeless Push/Pull/Legs 6-day split. High volume, high frequency — designed to maximize muscle and strength gains for intermediate to advanced lifters.',
  '💪', 'linear-gradient(135deg, #e07b15 0%, #a8550c 100%)', 6, 'Ongoing', 'Intermediate+',
  '["Volume","Strength"]'::jsonb,
  '["Push","Pull","Legs","Push","Pull","Legs","Rest"]'::jsonb,
  '[{"name":"Push/Pull/Legs","weekCount":52}]'::jsonb,
  true, 1
where not exists (select 1 from public.workout_routines where builtin_key = 'classic-ppl' and owner_id is null);

insert into public.workout_routines (builtin_key, name, eyebrow, description, icon, gradient, days_per_week, duration, level, tags, schedule, stages, is_default, sort_order)
select 'full-body-3x', 'Full Body 3×', 'Beginner · Efficient',
  'Three full-body sessions per week hitting every muscle group each workout. Perfect for beginners or those with limited time who want balanced development.',
  '⚡', 'linear-gradient(135deg, #f5c842 0%, #c48a0a 100%)', 3, 'Ongoing', 'Beginner',
  '["Full Body","Efficiency"]'::jsonb,
  '["Full Body","Rest","Full Body","Rest","Full Body","Rest","Rest"]'::jsonb,
  '[{"name":"Full Body","weekCount":52}]'::jsonb,
  true, 2
where not exists (select 1 from public.workout_routines where builtin_key = 'full-body-3x' and owner_id is null);

insert into public.workout_routines (builtin_key, name, eyebrow, description, icon, gradient, days_per_week, duration, level, tags, schedule, stages, is_default, sort_order)
select 'bro-split', 'Classic Bro Split', 'Bodybuilding · Traditional',
  'Chest/Tri, Back/Bi, Shoulders, Legs, Arms — one muscle group per day with maximum focus and volume per session. The original bodybuilding blueprint.',
  '🏆', 'linear-gradient(135deg, #ff7a4d 0%, #9c3a12 100%)', 5, 'Ongoing', 'All Levels',
  '["Bodybuilding","Classic"]'::jsonb,
  '["Chest & Tri","Back & Bi","Shoulders","Arms","Legs","Rest","Rest"]'::jsonb,
  '[{"name":"Split Training","weekCount":52}]'::jsonb,
  true, 3
where not exists (select 1 from public.workout_routines where builtin_key = 'bro-split' and owner_id is null);

-- Business templates (metadata; rich steps resolved from APP_DATA by builtin_key) -----
insert into public.business_templates (builtin_key, name, description, icon, is_default, sort_order)
select 'hormozi', 'Hormozi 9-Stage Roadmap', 'Alex Hormozi''s framework for scaling a business from $0 to exit. Each stage has a clear graduation criterion.', '🚀', true, 0
where not exists (select 1 from public.business_templates where builtin_key = 'hormozi' and owner_id is null);

insert into public.business_templates (builtin_key, name, description, icon, is_default, sort_order)
select 'saas_mvp', 'SaaS MVP Blueprint', 'Step-by-step guide to building, launching, and getting first paying customers for a SaaS product.', '💻', true, 1
where not exists (select 1 from public.business_templates where builtin_key = 'saas_mvp' and owner_id is null);

insert into public.business_templates (builtin_key, name, description, icon, is_default, sort_order)
select 'content_marketing', 'Content Marketing Flywheel', 'Build a compounding content engine that drives inbound leads without paid ads.', '📣', true, 2
where not exists (select 1 from public.business_templates where builtin_key = 'content_marketing' and owner_id is null);

insert into public.business_templates (builtin_key, name, description, icon, is_default, sort_order)
select 'social_media', 'Social Media Strategy', 'Build a consistent social presence that drives brand awareness and inbound interest.', '📱', true, 3
where not exists (select 1 from public.business_templates where builtin_key = 'social_media' and owner_id is null);

-- Passion / interest templates --------------------------------------------
insert into public.passion_templates (builtin_key, name, description, icon, fields, is_default, sort_order)
select 'music', 'Music', 'Track songs you''re learning, practice sessions, and gear.', '🎸',
  '["Songs learning","Practice log (min)","Gear","Goals"]'::jsonb, true, 0
where not exists (select 1 from public.passion_templates where builtin_key = 'music' and owner_id is null);

insert into public.passion_templates (builtin_key, name, description, icon, fields, is_default, sort_order)
select 'hunting', 'Hunting', 'Seasons, tags, spots, and harvest log.', '🏹',
  '["Season/tags","Spots","Gear checklist","Harvest log"]'::jsonb, true, 1
where not exists (select 1 from public.passion_templates where builtin_key = 'hunting' and owner_id is null);

insert into public.passion_templates (builtin_key, name, description, icon, fields, is_default, sort_order)
select 'fishing', 'Fishing', 'Catch log, spots, conditions, and tackle.', '🎣',
  '["Catch log","Spots","Conditions","Tackle box"]'::jsonb, true, 2
where not exists (select 1 from public.passion_templates where builtin_key = 'fishing' and owner_id is null);

insert into public.passion_templates (builtin_key, name, description, icon, fields, is_default, sort_order)
select 'motorcycles', 'Motorcycles', 'Rides, maintenance, mods, and routes.', '🏍️',
  '["Ride log (miles)","Maintenance","Mods/build","Routes"]'::jsonb, true, 3
where not exists (select 1 from public.passion_templates where builtin_key = 'motorcycles' and owner_id is null);

insert into public.passion_templates (builtin_key, name, description, icon, fields, is_default, sort_order)
select 'pool', 'Pool / Billiards', 'Drills, match record, and skills to sharpen.', '🎱',
  '["Match record","Drills","Skills to sharpen","Run-out best"]'::jsonb, true, 4
where not exists (select 1 from public.passion_templates where builtin_key = 'pool' and owner_id is null);

-- Recipes — a starter set of shipped defaults (the rest can be backfilled from APP_DATA) --
insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_chicken_veg', 'Chicken Breast & Roasted Veg', 'Simple', 'American', 650, 57, 48, 25, true
where not exists (select 1 from public.recipes where builtin_key = 'def_chicken_veg' and owner_id is null);

insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_shrimp_caulirice', 'Shrimp & Cauliflower Rice Bowl', 'Simple', 'Asian', 650, 57, 48, 25, true
where not exists (select 1 from public.recipes where builtin_key = 'def_shrimp_caulirice' and owner_id is null);

insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_turkey_meatball', 'Prepped Turkey Meatball Zucchini Bowls', 'Premade', 'Italian', 650, 57, 48, 25, true
where not exists (select 1 from public.recipes where builtin_key = 'def_turkey_meatball' and owner_id is null);

insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_pork_vermicelli', 'Vietnamese Grilled Pork Vermicelli Bowl', 'Gourmet', 'Vietnamese', 650, 57, 48, 25, true
where not exists (select 1 from public.recipes where builtin_key = 'def_pork_vermicelli' and owner_id is null);

insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_cottage_cucumber', 'Cottage Cheese & Cucumber Plate', 'Simple', 'American', 550, 48, 43, 22, true
where not exists (select 1 from public.recipes where builtin_key = 'def_cottage_cucumber' and owner_id is null);

insert into public.recipes (builtin_key, name, category, cuisine, calories, protein, carbs, fats, is_default)
select 'def_salmon_tataki', 'Salmon Tataki with Ponzu Salad', 'Gourmet', 'Japanese', 550, 48, 43, 22, true
where not exists (select 1 from public.recipes where builtin_key = 'def_salmon_tataki' and owner_id is null);
