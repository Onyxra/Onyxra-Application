import { createBrowserClient } from '@supabase/ssr';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;
  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY
  );
  return supabase;
}
