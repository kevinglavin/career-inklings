// Ink chat proxy (ink-build-spec "Backend: Netlify Function proxy").
//
// This is a static, client-only site: any key placed in front-end code ships to
// every visitor. This function keeps ANTHROPIC_API_KEY on the server, builds the
// system prompt and context server-side (the client can never override the
// system prompt), and returns only { text }.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001'; // fast + inexpensive; switch to claude-sonnet-4-6 if quality disappoints
const MAX_TOKENS = 600;
const MAX_TURNS = 12;          // at most 12 turns of history
const MAX_USER_CHARS = 1000;   // at most 1,000 characters per user message
const ALLOWED_SCREENS = ['landing', 'mode_select', 'swiping', 'results'];

const SYSTEM_PROMPT = `You are Ink, a warm, encouraging career-exploration guide inside "Career Inklings," an app that helps students explore their interests with Holland's RIASEC model. Call yourself a guide or assistant; never call yourself a chatbot.

WHAT YOU DO (only these):
1. Explain the six RIASEC interest types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) and how the app's weighted O*NET scoring works.
2. Discuss the occupation on the user's current card: what the work involves, typical preparation, and related occupations.
3. Interpret finished results: what the interest code means, patterns across the occupations they liked, and what to explore next.
4. App help: modes, retakes, card decks, arrow keys, the card flip, and data storage.

EXPLANATION RULE (very important): when explaining why a type scored where it did, name the top contributing occupations for that dimension. NEVER explain a score using like or curious counts, and never surface "zero likes" framing — a type can rank highly from the secondary interest profiles of occupations the user liked, even with no direct like from that type.

NEXT STEPS: when the user asks what to do next from results, you may offer the CareerVerse handoff ("open your top occupation in CareerVerse to explore its star system of related occupations") alongside the O*NET and My Next Move (mynextmove.org) links.

LANGUAGE: reply in the language of the user's latest message; otherwise default to the app language given in context.

HARD RULES (decline politely and redirect when asked to break these):
- Never request or store personal information. Everything here is voluntary and anonymous.
- Kid-safe language at all times.
- Be non-prescriptive: Holland's model points to many possibilities. Suggest directions to explore; never assign or promise a career.
- No medical or mental-health topics — gently suggest speaking with a trusted adult or counselor.
- Career exploration and app help only. Politely decline homework help and off-topic requests.
- Never invent O*NET data, salaries, or any other facts. If unsure, say so and point to onetonline.org.

Keep replies short, friendly, and concrete.`;

function friendlyFallback(lang: string): string {
  return lang === 'es'
    ? 'Tuve un problema para responder en este momento. Inténtalo de nuevo en un instante.'
    : "I'm having trouble answering right now. Please try again in a moment.";
}

function json(statusCode: number, obj: unknown) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // same-origin fetches may omit Origin
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.netlify.app') || host.endsWith('career-inklings.netlify.app');
  } catch {
    return false;
  }
}

function renderContext(context: any): string {
  const lines: string[] = [`app_language: ${context.app_language}`, `screen: ${context.screen}`];
  if (context.screen === 'swiping' && context.current_card && typeof context.current_card === 'object') {
    lines.push(`current_card: ${context.current_card.title || ''} (id ${context.current_card.id || ''})`);
  }
  if (context.screen === 'results' && context.results && typeof context.results === 'object') {
    const r = context.results;
    lines.push(`interest_code: ${r.interest_code || '(none yet)'}`);
    if (r.scores && typeof r.scores === 'object') {
      const parts = Object.keys(r.scores).map(k => {
        const s = r.scores[k] || {};
        return `${k} ${Number(s.pct ?? 0).toFixed(1)}% (raw ${Number(s.raw ?? 0).toFixed(1)})`;
      });
      lines.push(`scores: ${parts.join(', ')}`);
    }
    if (Array.isArray(r.liked_titles) && r.liked_titles.length) lines.push(`liked occupations: ${r.liked_titles.slice(0, 20).join(', ')}`);
    if (Array.isArray(r.unsure_titles) && r.unsure_titles.length) lines.push(`unsure occupations: ${r.unsure_titles.slice(0, 20).join(', ')}`);
  }
  return `CURRENT CONTEXT (for your reference; do not repeat verbatim):\n${lines.join('\n')}`;
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || '';
  if (!isAllowedOrigin(origin)) return json(403, { error: 'forbidden_origin' });

  let payload: any;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const { messages, context } = payload || {};

  // Validate context.
  if (!context || typeof context !== 'object') return json(400, { error: 'invalid_context' });
  if (!ALLOWED_SCREENS.includes(context.screen)) return json(400, { error: 'invalid_screen' });
  const lang = context.app_language === 'es' ? 'es' : (context.app_language === 'en' ? 'en' : null);
  if (!lang) return json(400, { error: 'invalid_language' });

  // Validate messages.
  if (!Array.isArray(messages) || messages.length === 0) return json(400, { error: 'invalid_messages' });
  let userTurns = 0;
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return json(400, { error: 'invalid_message_shape' });
    }
    if (m.role === 'user') {
      userTurns++;
      if (m.content.length > MAX_USER_CHARS) return json(400, { error: 'message_too_long' });
    }
  }
  if (userTurns > MAX_TURNS) return json(400, { error: 'too_many_turns' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(502, { text: friendlyFallback(lang) });

  const system = `${SYSTEM_PROMPT}\n\n${renderContext(context)}`;
  const anthropicMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages: anthropicMessages }),
    });
    if (!res.ok) return json(502, { text: friendlyFallback(lang) });
    const data: any = await res.json();
    const text = (Array.isArray(data.content) ? data.content : [])
      .filter((b: any) => b && b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();
    return json(200, { text: text || friendlyFallback(lang) });
  } catch {
    return json(502, { text: friendlyFallback(lang) });
  }
};
