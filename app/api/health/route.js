/**
 * ONYXRA — /api/health
 *
 * Quick diagnostic endpoint to verify which env vars are wired up.
 * Returns booleans only — never returns actual values.
 *
 * Hit this URL after deploy to confirm everything is connected.
 */

import { getSupabaseUrl, getSupabasePublicKey, getSupabaseSecretKey } from '../../../lib/supabase-env';

export const runtime = 'edge';

export async function GET() {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();
  const secretKey = getSupabaseSecretKey();

  return Response.json({
    ok: Boolean(url && publicKey),
    supabase: {
      url:        Boolean(url),
      publicKey:  Boolean(publicKey),
      secretKey:  Boolean(secretKey),
      urlPreview: url ? url.replace(/^(https?:\/\/[^.]{4})[^.]*/, '$1***') : null,
    },
    aiGateway: {
      url: Boolean(process.env.NEXT_PUBLIC_AI_GATEWAY_URL),
      key: Boolean(process.env.AI_GATEWAY_API_KEY),
    },
    envVarNames: {
      // Show which env var names actually have values
      NEXT_PUBLIC_SUPABASE_URL:               Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_API_KEY:           Boolean(process.env.NEXT_PUBLIC_SUPABASE_API_KEY),
      NEXT_PUBLIC_SUPABASE_ANON_KEY:          Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:   Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      SUPABASE_SECRET_KEY:                    Boolean(process.env.SUPABASE_SECRET_KEY),
      SUPABASE_SERVICE_ROLE_KEY:              Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      AI_GATEWAY_API_KEY:                     Boolean(process.env.AI_GATEWAY_API_KEY),
      NEXT_PUBLIC_AI_GATEWAY_URL:             Boolean(process.env.NEXT_PUBLIC_AI_GATEWAY_URL),
    },
  });
}
