import { createSupabaseServer } from '../../../../lib/supabase-server';
import { hasSupabaseConfig } from '../../../../lib/supabase-env';

/**
 * ONYXRA — /api/auth/login
 *
 * Server-side email + password sign-in. Runs where the Supabase credentials
 * ALWAYS exist: the Vercel↔Supabase integration syncs SUPABASE_URL /
 * SUPABASE_ANON_KEY (and their NEXT_PUBLIC_ variants) server-side, even when the
 * browser bundle never receives the NEXT_PUBLIC_ ones. On success @supabase/ssr
 * writes the session cookie via createSupabaseServer's cookie adapter, so the
 * rest of the app (chat API, etc.) sees the authenticated user.
 *
 * Responses:
 *   200 { ok: true }               → signed in; session cookie set
 *   401 { error }                  → bad credentials / unconfirmed email
 *   200 { fallback: true, error }  → Supabase not configured (gate uses passcode)
 *   400 { error }                  → missing fields
 */
export async function POST(request) {
  let email;
  let password;
  try {
    ({ email, password } = await request.json());
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // No Supabase env on the server → let the client fall back to the local passcode.
  if (!hasSupabaseConfig()) {
    return Response.json({ fallback: true, error: 'Supabase is not configured.' }, { status: 200 });
  }

  try {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });
    if (error) {
      return Response.json(
        { error: error.message || 'Invalid login credentials.' },
        { status: 401 }
      );
    }
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    return Response.json({ error: (e && e.message) || 'Sign-in failed.' }, { status: 500 });
  }
}
