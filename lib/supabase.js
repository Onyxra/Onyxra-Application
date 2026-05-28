import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabasePublicKey } from './supabase-env';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;

  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) {
    console.error('[Supabase] Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and a public key (anon/api/publishable).');
    return null;
  }

  supabase = createBrowserClient(url, key);
  return supabase;
}
