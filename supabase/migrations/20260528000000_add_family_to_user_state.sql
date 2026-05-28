-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Add Family section to user_state                      ║
-- ║  Adds a jsonb 'family' column for tracking family members and    ║
-- ║  what they're up to.                                            ║
-- ║  Idempotent: safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Add family column with sensible default
alter table public.user_state
  add column if not exists family jsonb default '{
    "activeMemberId": null,
    "members": []
  }'::jsonb;

-- Backfill any rows that have null family
update public.user_state
set family = '{"activeMemberId": null, "members": []}'::jsonb
where family is null;
