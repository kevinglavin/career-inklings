// Site-wide HTTP Basic Auth gate for the private beta. Runs on Netlify's Deno
// edge runtime on every path. Username is fixed ("inklings"); the password comes
// from the SITE_PASSWORD environment variable. Missing or wrong credentials get
// a 401 with a WWW-Authenticate: Basic header so the browser prompts for login.
//
// `Netlify` is a global provided by the edge runtime; declared locally so this
// file also typechecks under the app's Node/DOM tsconfig.
declare const Netlify: { env: { get(key: string): string | undefined } };

const USERNAME = 'inklings';

export default async (request: Request, context: { next: () => Promise<Response> | Response }): Promise<Response> => {
  const expected = Netlify.env.get('SITE_PASSWORD');

  const unauthorized = () =>
    new Response('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Career Inklings", charset="UTF-8"' },
    });

  // No password configured -> fail closed.
  if (!expected) return unauthorized();

  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  const user = sep >= 0 ? decoded.slice(0, sep) : '';
  const pass = sep >= 0 ? decoded.slice(sep + 1) : '';

  if (user !== USERNAME || pass !== expected) return unauthorized();

  return context.next();
};

export const config = { path: '/*' };
