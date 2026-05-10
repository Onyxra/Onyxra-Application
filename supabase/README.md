# Onyxra — Supabase Migrations

All database schema changes live in `supabase/migrations/` as timestamped SQL files.

## How it works

1. **Filename format:** `YYYYMMDDHHMMSS_short_description.sql`
   - Example: `20260510000000_rename_profiles_to_users.sql`
2. **Order:** Supabase runs them in timestamp order
3. **Tracking:** Supabase records applied migrations in `supabase_migrations.schema_migrations` — each file runs exactly once
4. **Idempotency:** Migrations should be written so re-running them is safe (use `if not exists`, `drop if exists`, etc.)

## Setup — connect GitHub to Supabase (one-time)

1. Go to **Supabase Dashboard → your project → Integrations**
2. Click **GitHub** → **Connect**
3. Authorize Supabase to access the `Onyxra-Application` repo
4. Set the **Supabase directory** to `supabase` (root of migrations folder)
5. Save

From this point on, **every push to `main`** that touches `supabase/migrations/` will auto-apply new migrations.

## Adding a new migration

1. Create a new file: `supabase/migrations/YYYYMMDDHHMMSS_what_it_does.sql`
2. Use a timestamp ≥ today's date (UTC) for ordering
3. Write idempotent SQL (use `create table if not exists`, `drop ... if exists`, etc.)
4. Commit and push — Supabase auto-applies on next deploy

## Never do this

- ❌ Don't edit a migration file after it's been applied
- ❌ Don't reuse a timestamp from an existing file
- ❌ Don't delete migration files (they're a historical record)

If you need to change something, **create a new migration** that modifies the previous state.
