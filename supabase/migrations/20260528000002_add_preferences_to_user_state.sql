-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Add Preferences section to user_state                  ║
-- ║  Adds a jsonb 'preferences' column for UI-level settings,        ║
-- ║  starting with bottomTabs (mobile bottom bar favorites).         ║
-- ║  Idempotent: safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.user_state
  add column if not exists preferences jsonb default '{
    "bottomTabs": ["dashboard", "workout", "nutrition", "business", "passions"]
  }'::jsonb;

update public.user_state
set preferences = '{"bottomTabs": ["dashboard", "workout", "nutrition", "business", "passions"]}'::jsonb
where preferences is null;
