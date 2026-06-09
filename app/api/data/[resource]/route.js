import { createSupabaseServer } from '../../../../lib/supabase-server';
import { hasSupabaseConfig } from '../../../../lib/supabase-env';

/**
 * ONYXRA — /api/data/[resource]
 *
 * One generic, cookie-authenticated CRUD endpoint over the library + stats
 * tables. RLS does the security; this route just whitelists columns and forces
 * owner_id = the signed-in user on writes.
 *
 *   GET    /api/data/routines              → all rows the user may see (defaults + own)
 *   POST   /api/data/routines   {..fields} → create one owned by the user
 *   PATCH  /api/data/routines   {id, ...}  → update one of the user's own rows
 *   DELETE /api/data/routines?id=<uuid>    → delete one of the user's own rows
 *
 * Responses use { rows } / { row } / { ok } and { error } / { fallback:true }.
 */

const RESOURCES = {
  'routines':           { table: 'workout_routines',       cols: ['name', 'eyebrow', 'description', 'icon', 'gradient', 'days_per_week', 'duration', 'level', 'tags', 'schedule', 'stages', 'program', 'sort_order'], order: 'sort_order' },
  'recipes':            { table: 'recipes',                cols: ['name', 'category', 'cuisine', 'calories', 'protein', 'carbs', 'fats', 'ingredients', 'tags', 'slot'], order: 'created_at' },
  'business-templates': { table: 'business_templates',     cols: ['name', 'description', 'icon', 'steps', 'sort_order'], order: 'sort_order' },
  'passion-templates':  { table: 'passion_templates',      cols: ['name', 'description', 'icon', 'fields', 'sort_order'], order: 'sort_order' },
  'personal-bests':     { table: 'workout_personal_bests', cols: ['exercise', 'weight', 'reps', 'est_one_rep_max', 'unit', 'notes', 'achieved_on'], order: 'exercise', upsert: 'owner_id,exercise' },
  'sessions':           { table: 'workout_sessions',       cols: ['routine_id', 'day_name', 'phase', 'week_number', 'exercises', 'notes', 'duration_min', 'logged_at'], order: 'logged_at' },
};

function pick(body, cols) {
  const out = {};
  for (const c of cols) if (body[c] !== undefined) out[c] = body[c];
  return out;
}

async function resolve(params) {
  const { resource } = await params;
  return { resource, cfg: RESOURCES[resource] || null };
}

async function getUserClient() {
  if (!hasSupabaseConfig()) return { fallback: true };
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { unauth: true };
  return { supabase, user };
}

export async function GET(request, { params }) {
  const { cfg } = await resolve(params);
  if (!cfg) return Response.json({ error: 'Unknown resource.' }, { status: 404 });

  const ctx = await getUserClient();
  if (ctx.fallback) return Response.json({ fallback: true, rows: [] }, { status: 200 });
  if (ctx.unauth) return Response.json({ error: 'Not signed in.', rows: [] }, { status: 401 });

  const { data, error } = await ctx.supabase.from(cfg.table).select('*').order(cfg.order, { ascending: true });
  if (error) return Response.json({ error: error.message, rows: [] }, { status: 500 });
  return Response.json({ rows: data || [] }, { status: 200 });
}

export async function POST(request, { params }) {
  const { cfg } = await resolve(params);
  if (!cfg) return Response.json({ error: 'Unknown resource.' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }

  const ctx = await getUserClient();
  if (ctx.fallback) return Response.json({ fallback: true }, { status: 200 });
  if (ctx.unauth) return Response.json({ error: 'Not signed in.' }, { status: 401 });

  const row = { ...pick(body, cfg.cols), owner_id: ctx.user.id };
  const q = ctx.supabase.from(cfg.table);
  const { data, error } = cfg.upsert
    ? await q.upsert(row, { onConflict: cfg.upsert }).select().single()
    : await q.insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ row: data }, { status: 200 });
}

export async function PATCH(request, { params }) {
  const { cfg } = await resolve(params);
  if (!cfg) return Response.json({ error: 'Unknown resource.' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
  const id = body.id;
  if (!id) return Response.json({ error: 'id is required.' }, { status: 400 });

  const ctx = await getUserClient();
  if (ctx.fallback) return Response.json({ fallback: true }, { status: 200 });
  if (ctx.unauth) return Response.json({ error: 'Not signed in.' }, { status: 401 });

  const patch = pick(body, cfg.cols);
  const { data, error } = await ctx.supabase.from(cfg.table).update(patch)
    .eq('id', id).eq('owner_id', ctx.user.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ row: data }, { status: 200 });
}

export async function DELETE(request, { params }) {
  const { cfg } = await resolve(params);
  if (!cfg) return Response.json({ error: 'Unknown resource.' }, { status: 404 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id is required.' }, { status: 400 });

  const ctx = await getUserClient();
  if (ctx.fallback) return Response.json({ fallback: true }, { status: 200 });
  if (ctx.unauth) return Response.json({ error: 'Not signed in.' }, { status: 401 });

  const { error } = await ctx.supabase.from(cfg.table).delete().eq('id', id).eq('owner_id', ctx.user.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true }, { status: 200 });
}
