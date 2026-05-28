-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Add Friends section to user_state                     ║
-- ║  Adds a jsonb 'friends' column for tracking friends separately   ║
-- ║  from family. Same shape as family.                              ║
-- ║  Idempotent: safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.user_state
  add column if not exists friends jsonb default '{
    "activeMemberId": null,
    "members": []
  }'::jsonb;

update public.user_state
set friends = '{"activeMemberId": null, "members": []}'::jsonb
where friends is null;
