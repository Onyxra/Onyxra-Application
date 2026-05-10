-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Rename profiles → users                                ║
-- ║  Run this in Supabase SQL Editor if you've already run the       ║
-- ║  original migration.sql with the "profiles" table.               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Drop the old trigger first (it references the old table) ──
drop trigger if exists on_auth_user_created on auth.users;

-- ── Rename the table ──
alter table public.profiles rename to users;

-- ── Drop and recreate policies with new table name ──
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;

create policy "Users can view own user"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own user"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own user"
  on public.users for insert
  with check (auth.uid() = id);

-- ── Recreate the new-user trigger to insert into public.users ──
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Recreate the updated_at trigger on the renamed table ──
drop trigger if exists update_profiles_updated_at on public.users;
drop trigger if exists update_users_updated_at on public.users;

create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();
