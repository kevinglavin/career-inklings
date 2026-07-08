// Unit tests for the Ink chat Netlify function: validation, origin check, and
// upstream handling — all without hitting the real Anthropic API.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../netlify/functions/ink-chat';

const goodContext = { app_language: 'en', screen: 'results' };
const goodMessages = [{ role: 'user', content: 'Explain the six interest types.' }];

const event = (over: Record<string, any> = {}) => ({
  httpMethod: 'POST',
  headers: { origin: 'https://career-inklings.netlify.app' },
  body: JSON.stringify({ messages: goodMessages, context: goodContext }),
  ...over,
});

const parse = (res: any) => ({ status: res.statusCode, body: JSON.parse(res.body) });

describe('ink-chat function', () => {
  const OLD_ENV = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { process.env.ANTHROPIC_API_KEY = OLD_ENV; vi.restoreAllMocks(); });

  it('rejects non-POST methods', async () => {
    expect(parse(await handler(event({ httpMethod: 'GET' }))).status).toBe(405);
  });

  it('rejects a foreign Origin', async () => {
    expect(parse(await handler(event({ headers: { origin: 'https://evil.example.com' } }))).status).toBe(403);
  });

  it('rejects invalid JSON', async () => {
    expect(parse(await handler(event({ body: '{not json' }))).status).toBe(400);
  });

  it('rejects an unknown screen', async () => {
    const body = JSON.stringify({ messages: goodMessages, context: { app_language: 'en', screen: 'nope' } });
    expect(parse(await handler(event({ body }))).status).toBe(400);
  });

  it('rejects an over-long user message', async () => {
    const body = JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(1001) }], context: goodContext });
    expect(parse(await handler(event({ body }))).status).toBe(400);
  });

  it('rejects more than 12 user turns', async () => {
    const messages = Array.from({ length: 13 }, () => ({ role: 'user', content: 'hi' }));
    const body = JSON.stringify({ messages, context: goodContext });
    expect(parse(await handler(event({ body }))).status).toBe(400);
  });

  it('returns a friendly 502 fallback when the API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = parse(await handler(event()));
    expect(res.status).toBe(502);
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.length).toBeGreaterThan(0);
  });

  it('proxies a successful reply as { text }', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Realistic, Investigative, Artistic…' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = parse(await handler(event()));
    expect(res.status).toBe(200);
    expect(res.body.text).toContain('Realistic');
    // The key must go to Anthropic via the x-api-key header, never to the client.
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-api-key']).toBe('test-key');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
  });

  it('returns a 502 fallback when the upstream call fails', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const res = parse(await handler(event()));
    expect(res.status).toBe(502);
    expect(res.body.text.length).toBeGreaterThan(0);
  });
});
