-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONYXRA — Goals & Targets column                                   ║
-- ║  Adds the goals JSONB section to user_state (the north-star        ║
-- ║  engine: calisthenics / singing / guitar / business / wealth       ║
-- ║  targets with progress history). Idempotent.                       ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.user_state
  add column if not exists goals jsonb default '{"items": []}'::jsonb;
