// Wrapper around Keystatic's GitHub OAuth callback.
//
// Problem: GitHub login codes are single-use, and the callback URL was being
// requested more than once (browser retries / background loaders), so a later
// request failed with "bad_verification_code" and that failure was shown.
//
// Fix:
//  - GET returns a tiny page. Its script POSTs the code back once, so only a
//    real browser running the page triggers the token exchange.
//  - Repeated codes on the same server replay the first result.
//  - If an exchange fails but the browser already has a login cookie (another
//    request succeeded), the page continues to /keystatic.
//  - Sends redirect_uri with the token exchange.
import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../../../keystatic.config';

export const prerender = false;

const handler = makeHandler({ config });

const steps: string[] = [];
type Stored = { status: number; headers: [string, string][]; body: string; diag: string };
const byCode = new Map<string, { at: number; result: Promise<Stored> }>();
const TTL_MS = 5 * 60 * 1000;

async function exchange(context: Parameters<APIRoute>[0], url: URL): Promise<Stored> {
  const redirectUri = `${url.origin}/api/keystatic/github/oauth/callback`;
  let diag = 'no token request was made';
  steps.length = 0;
  steps.push('exchange started');
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const u0 = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!u0.startsWith('https://github.com/login/oauth/access_token')) return realFetch(input, init);
    const u = new URL(u0);
    if (u.searchParams.has('code') && !u.searchParams.has('redirect_uri')) u.searchParams.set('redirect_uri', redirectUri);
    steps.push('github request sent');
    const res = await realFetch(u, { ...init, signal: AbortSignal.timeout(15000) });
    steps.push(`github replied HTTP ${res.status}`);
    const text = await res.text();
    steps.push('github reply read');
    try {
      const data = JSON.parse(text);
      diag = `error=${data.error ?? 'none'}; description=${data.error_description ?? 'none'}; fields=${Object.keys(data).join(',')}`;
    } catch {
      diag = `HTTP ${res.status}; non-JSON response`;
    }
    lastDiag = diag;
    return new Response(text, { status: res.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  try {
    const getReq = new Request(url, { method: 'GET', headers: context.request.headers });
    const res = await handler({ request: getReq } as Parameters<APIRoute>[0]);
    steps.push(`keystatic finished ${res.status}`);
    const headers: [string, string][] = [];
    for (const c of res.headers.getSetCookie()) headers.push(['set-cookie', c]);
    const loc = res.headers.get('location');
    if (loc) headers.push(['x-ks-location', loc]);
    return { status: res.status, headers, body: await res.text(), diag };
  } finally {
    globalThis.fetch = realFetch;
  }
}

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Signing in…</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5}pre{white-space:pre-wrap;background:#f3f3f3;padding:1rem;border-radius:8px}</style></head>
<body><p id="m">Signing you in…</p><pre id="d" hidden></pre>
<script>
(async function () {
  var m = document.getElementById('m'), d = document.getElementById('d');
  function loggedIn() { return document.cookie.indexOf('keystatic-gh-access-token=') !== -1; }
  try {
    var timer = setTimeout(function () { m.textContent = 'Still waiting for the server after 25 seconds. Please send a screenshot.'; }, 25000);
    var r = await fetch(location.pathname + location.search, { method: 'POST', credentials: 'same-origin' });
    clearTimeout(timer);
    var t = await r.text(); var j;
    try { j = JSON.parse(t); } catch (pe) { j = { ok: false, details: 'HTTP ' + r.status + ' ' + r.statusText + '\n' + t.slice(0, 500) }; }
    if (j.ok) { location.replace(j.location || '/keystatic'); return; }
    await new Promise(function (res) { setTimeout(res, 1500); });
    if (loggedIn()) { location.replace('/keystatic'); return; }
    m.textContent = 'Sign-in failed. Please send a screenshot of this page.';
    d.textContent = j.details; d.hidden = false;
  } catch (e) {
    if (loggedIn()) { location.replace('/keystatic'); return; }
    m.textContent = 'Sign-in failed: ' + e;
  }
})();
</script></body></html>`;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  // Errors from GitHub (no code) go straight to Keystatic's normal handling.
  if (!url.searchParams.get('code')) {
    const res = await handler({ request } as Parameters<APIRoute>[0]);
    return res;
  }
  return new Response(page, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' },
  });
};

export const POST: APIRoute = async (context) => {
  try {
    return await post(context);
  } catch (e) {
    const err = e as Error;
    return new Response(
      JSON.stringify({ ok: false, location: null, details: `Server error: ${err?.name}: ${err?.message}\n${(err?.stack ?? '').split('\n').slice(0, 6).join('\n')}\nlast exchange: ${lastDiag}\nsteps: ${steps.join(' > ')}` }),
      { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
    );
  }
};

let lastDiag = 'none';

const post: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code') ?? '';
  const now = Date.now();
  for (const [k, v] of byCode) if (now - v.at > TTL_MS) byCode.delete(k);
  let entry = byCode.get(code);
  const replay = !!entry;
  if (!entry) {
    entry = { at: now, result: exchange(context, url) };
    byCode.set(code, entry);
  }
  let s: Stored;
  try {
    s = await entry.result;
  } catch (e) {
    byCode.delete(code);
    throw e;
  }
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  let location: string | null = null;
  for (const [k, v] of s.headers) {
    if (k === 'x-ks-location') location = v;
    else headers.append(k, v);
  }
  const ok = s.status >= 300 && s.status < 400 && !!location;
  const details = `${s.body}\n${s.diag}\nreplayed=${replay}; status=${s.status}\nsteps: ${steps.join(' > ')}`;
  return new Response(JSON.stringify({ ok, location, details }), { status: 200, headers });
};
