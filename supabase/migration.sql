-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Supabase Database Migration                          ║
-- ║  Run this in Supabase SQL Editor (Dashboard → SQL Editor)       ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Users table (extends auth.users with display info) ──
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── User state table — one row per user, JSONB columns per section ──
create table if not exists public.user_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  version integer default 2,
  dashboard jsonb default '{
    "weeklyTopPriority": "",
    "weeklyPriorityDate": null,
    "todayPriorities": ["", "", ""],
    "todayPrioritiesDate": null,
    "tasks": [],
    "customHabits": null
  }'::jsonb,
  workout jsonb default '{
    "currentPhase": "recovery",
    "schedule": ["Upper", "Lower", "Rest", "Pull", "Push", "Legs", "Rest"],
    "currentDayIndex": 0,
    "cycleCount": 0,
    "weekNumber": 1,
    "log": [],
    "logbook": [],
    "progressPics": [],
    "routines": [],
    "activeRoutineId": null,
    "favoriteExercises": [],
    "bodyGoals": {"currentWeight": "", "goalWeight": "", "currentBF": "", "goalBF": ""}
  }'::jsonb,
  nutrition jsonb default '{
    "currentPhase": "maintain",
    "selectedMeals": {"bulk": [null,null,null,null], "maintain": [null,null,null,null], "cut": [null,null,null,null]},
    "customMeals": {"bulk": [[],[],[],[]], "maintain": [[],[],[],[]], "cut": [[],[],[],[]]},
    "calcWeight": 175,
    "calcHeight": 70,
    "calcGoal": "maintain",
    "calcActivity": 14,
    "startWeight": 0,
    "startBodyFat": 0,
    "currentBodyFat": 0,
    "goalBodyFat": 0,
    "foodLibrary": [],
    "userMeals": [],
    "mealPlan": {},
    "slotOptions": {"0":[],"1":[],"2":[],"3":[]},
    "mealDistribution": [25, 30, 35, 10]
  }'::jsonb,
  business jsonb default '{
    "activeVentureId": null,
    "activeBlueprintId": null,
    "ventures": []
  }'::jsonb,
  passions jsonb default '{
    "activePassionId": null,
    "passions": []
  }'::jsonb,
  wealth jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ── Row Level Security ──
alter table public.users enable row level security;
alter table public.user_state enable row level security;

-- Users: each user can only read/write their own row
create policy "Users can view own user"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own user"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own user"
  on public.users for insert
  with check (auth.uid() = id);

-- User state: users can only read/write their own state
create policy "Users can view own state"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "Users can update own state"
  on public.user_state for update
  using (auth.uid() = user_id);

create policy "Users can insert own state"
  on public.user_state for insert
  with check (auth.uid() = user_id);

-- ── Auto-create user + state on signup ──
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email);

  insert into public.user_state (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Updated_at auto-update ──
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

drop trigger if exists update_user_state_updated_at on public.user_state;
create trigger update_user_state_updated_at
  before update on public.user_state
  for each row execute function public.update_updated_at();
