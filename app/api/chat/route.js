/**
 * ONYXRA — /api/chat
 *
 * Server-side chat endpoint that proxies to the Vercel AI Gateway.
 * Receives the user's message + a context object describing their
 * current state (today's workout, meals, tasks, ventures, etc.) and
 * returns a single AI response.
 *
 * Env vars required (set in Vercel → Project Settings → Environment Variables):
 *   AI_GATEWAY_API_KEY            (secret — server-only)
 *   NEXT_PUBLIC_AI_GATEWAY_URL    (e.g. https://gateway.ai.vercel.com/v1)
 */

import { createSupabaseServer } from '../../../lib/supabase-server';

export const runtime = 'edge';

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5';

function buildSystemPrompt(profile, snapshot) {
  const name = profile?.display_name || snapshot?.profile?.name || 'there';
  return `You are Onyxra — ${name}'s personal AI life assistant.

Their Life OS is organized into five main categories:

  • PEOPLE    → Relationship (significant other), Family, Friends
  • HEALTH    → Workout, Nutrition
  • WEALTH    → Investments
  • BUSINESS  → Ventures they're building
  • INTERESTS → Music, hunting, fishing, motorcycles, pool, and other hobbies they care about

Tone: direct, warm, action-oriented. Talk like a sharp friend, not a corporate AI. Short sentences.
Use bullet points when listing things. Use emoji sparingly to mark sections (💕 ❤︎ 🧑 🏋️ 🍽️ 💰 🏗️ ✦).
When asked about a category (e.g. "How's my Health?"), zoom out and summarize across its sub-areas.

You have live access to ${name}'s data below. Reference specifics when relevant.
If asked about something not in the snapshot, say so honestly — don't make stuff up.

═══════════════════════════════════════════
CURRENT SNAPSHOT (live data)
═══════════════════════════════════════════
${JSON.stringify(snapshot, null, 2)}
═══════════════════════════════════════════

When the user asks for "today's workout", "what should I eat", "what's next", etc., pull from the snapshot above.
When you spot priorities/tasks that are stale or unclear, suggest improvements.
Keep responses concise — usually under 5 sentences unless they ask for detail.`;
}

export async function POST(request) {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    const gatewayUrl = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1';

    if (!apiKey) {
      return Response.json(
        { error: 'AI_GATEWAY_API_KEY not configured in Vercel environment variables.' },
        { status: 500 }
      );
    }

    const { messages = [], snapshot = {} } = await request.json();

    // Single-user mode: auth is OPTIONAL. If a Supabase session happens to
    // exist we enrich the prompt with the stored profile, but we never block
    // the chat — the name falls back to the client-sent snapshot.
    let profile = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        profile = data;
      }
    } catch {
      // No auth / no Supabase — fine. Chat still works from the snapshot.
    }

    const systemPrompt = buildSystemPrompt(profile, snapshot);

    const upstream = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[AI Gateway] Error:', upstream.status, errText);
      return Response.json(
        { error: `AI Gateway returned ${upstream.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content || '...';

    return Response.json({ reply });
  } catch (err) {
    console.error('[chat] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
