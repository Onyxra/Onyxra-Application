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

// Default to a model the Vercel AI Gateway FREE tier allows. Verified 200 OK
// on 2026-05-28: openai/gpt-4o-mini, openai/gpt-5-mini, google/gemini-2.0-flash.
// Premium models (e.g. anthropic/claude-sonnet-4-5) require paid credits — once
// credits are added, switch instantly by setting the AI_GATEWAY_MODEL env var
// (no code redeploy needed), or per-request via the `model` field in the body.
const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-4o-mini';

const ACTIONS_PROTOCOL = `
═══════════════════════════════════════════
ACTING ON THEIR LIFE (you can DO things, not just talk)
═══════════════════════════════════════════
You can change their data. When the user asks to record, add, log, update,
complete, or set something, do BOTH:
  1. Reply in one short, natural sentence confirming it — like a friend would.
     NEVER mention JSON, "actions", or that you're a tool.
  2. Append EXACTLY ONE fenced block at the very end of your message:

\`\`\`onyxra
{"actions":[ {"type":"...", ...} ]}
\`\`\`

Only emit the block when something should actually change. Pure questions get
NO block. Supported actions (use only these types and fields):

  {"type":"add_task","text":"Call the dentist"}
  {"type":"complete_task","text":"dentist"}            // matches an open task
  {"type":"set_priority","text":"Ship the MVP"}        // the week's #1 focus
  {"type":"add_today_priority","text":"Gym at 5pm"}
  {"type":"log_weight","value":182}                    // lbs
  {"type":"log_bodyfat","value":14.5}                  // percent
  {"type":"log_networth","value":52000}
  {"type":"add_journal","text":"Felt great after training","mood":4}  // mood 1-5 optional
  {"type":"set_mood","value":4}                        // 1 awful … 5 amazing
  {"type":"add_habit","name":"Read 20 min","ring":"focus","icon":"📚"}  // ring: focus|body|connect
  {"type":"tick_habit","name":"Read"}                  // marks it done today
  {"type":"log_workout","title":"Push day","notes":"Bench felt strong"}
  {"type":"add_gift_idea","text":"Concert tickets"}
  {"type":"add_relationship_update","text":"Planned a weekend trip"}
  {"type":"add_family_update","name":"Mom","text":"Recovering well after surgery"}
  {"type":"add_friend_update","name":"Jake","text":"Got the new job"}
  {"type":"navigate","page":"workout"}                 // dashboard|workout|nutrition|wealth|business|passions|relationship|family|friends|settings
  {"type":"show_card","card":"meal"}                    // pop a live card on the dashboard: meal|workout|focus|money|connect

When the user asks "what's my next meal / today's workout / how's my money", prefer
show_card so they get an interactive card, and keep your sentence short.

Numbers must be raw (182 not "182 lbs"). Put MULTIPLE actions in the one array
when the user says several things at once. Match names/tasks to what already
exists in the snapshot. If you can't map a request to an action, just answer.`;

function buildSystemPrompt(profile, snapshot, capture) {
  const name = profile?.display_name || snapshot?.profile?.name || 'there';
  const captureNote = capture ? `

CAPTURE MODE: this came from the quick-capture bar. Be terse — a single short
confirmation sentence, then the action block. Default to taking an action.` : '';
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
Keep responses concise — usually under 5 sentences unless they ask for detail.
${ACTIONS_PROTOCOL}${captureNote}`;
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

    const { messages = [], snapshot = {}, model, capture = false } = await request.json();

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

    const systemPrompt = buildSystemPrompt(profile, snapshot, capture);

    const upstream = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
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

      // Translate the common gateway failures into a human sentence so the orb
      // says something sensible instead of dumping raw JSON into the chat.
      let friendly;
      if (upstream.status === 429) {
        friendly = "I'm thinking a little too fast — that's the free-tier rate limit. Give me a few seconds, then ask again.";
      } else if (upstream.status === 403) {
        friendly = 'That model needs paid AI credits. Add credits in Vercel (or point AI_GATEWAY_MODEL at a free model) and I’ll be right back.';
      } else {
        let detail = errText.slice(0, 160);
        try { detail = JSON.parse(errText)?.error?.message || detail; } catch {}
        friendly = `AI hiccup (${upstream.status}): ${detail}`;
      }

      return Response.json({ error: friendly }, { status: 502 });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content || '...';

    return Response.json({ reply });
  } catch (err) {
    console.error('[chat] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
