-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Add Relationship section to user_state                 ║
-- ║  Single-partner profile: name, notes, updates, important dates,  ║
-- ║  gift ideas.                                                     ║
-- ║  Idempotent: safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.user_state
  add column if not exists relationship jsonb default '{
    "name": "",
    "icon": "💕",
    "startDate": null,
    "notes": "",
    "updates": [],
    "dates": [],
    "giftIdeas": []
  }'::jsonb;

update public.user_state
set relationship = '{"name": "", "icon": "💕", "startDate": null, "notes": "", "updates": [], "dates": [], "giftIdeas": []}'::jsonb
where relationship is null;
