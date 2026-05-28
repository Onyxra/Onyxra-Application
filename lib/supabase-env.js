/**
 * ONYXRA — Supabase env var resolver
 *
 * Different Supabase setups use different env var names:
 *   - Vercel's official Supabase integration:
 *       NEXT_PUBLIC_SUPABASE_URL
 *       NEXT_PUBLIC_SUPABASE_ANON_KEY
 *       SUPABASE_SERVICE_ROLE_KEY
 *
 *   - Custom setup (what we originally used):
 *       NEXT_PUBLIC_SUPABASE_URL
 *       NEXT_PUBLIC_SUPABASE_API_KEY
 *       SUPABASE_SECRET_KEY
 *
 *   - Newer Supabase docs:
 *       NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * This helper tries each in order so the app works no matter how the
 * env vars are named in Vercel.
 */

export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  );
}

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}

export function getSupabaseSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}
