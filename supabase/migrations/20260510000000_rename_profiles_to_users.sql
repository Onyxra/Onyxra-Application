-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Rename profiles → users                                ║
-- ║  Idempotent: safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Only rename if profiles exists and users doesn't ──
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'profiles')
    and not exists (select 1 from information_schema.tables
                    where table_schema = 'public' and table_name = 'users') then

    -- Drop trigger that references the table (we recreate below)
    drop trigger if exists on_auth_user_created on auth.users;

    -- Rename
    alter table public.profiles rename to users;
  end if;
end $$;

-- ── Recreate policies on the (possibly new) users table ──
-- These run regardless to ensure final state is correct.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'users') then

    -- Drop any old policies (under old or new names)
    execute 'drop policy if exists "Users can view own profile" on public.users';
    execute 'drop policy if exists "Users can update own profile" on public.users';
    execute 'drop policy if exists "Users can insert own profile" on public.users';
    execute 'drop policy if exists "Users can view own user" on public.users';
    execute 'drop policy if exists "Users can update own user" on public.users';
    execute 'drop policy if exists "Users can insert own user" on public.users';

    -- Recreate with new names
    execute 'create policy "Users can view own user" on public.users for select using (auth.uid() = id)';
    execute 'create policy "Users can update own user" on public.users for update using (auth.uid() = id)';
    execute 'create policy "Users can insert own user" on public.users for insert with check (auth.uid() = id)';
  end if;
end $$;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Recreate updated_at trigger on the renamed table ──
drop trigger if exists update_profiles_updated_at on public.users;
drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();
