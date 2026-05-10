import { createBrowserClient } from '@supabase/ssr';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_API_KEY;

  if (!url || !key) {
    console.error('[Supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_API_KEY');
    return null;
  }

  supabase = createBrowserClient(url, key);
  return supabase;
}
