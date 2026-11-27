// Wrapper around Keystatic's GitHub OAuth callback.
//
// Why: some browsers request the callback URL twice. GitHub login codes work
// only once, so the second request failed with "bad_verification_code" and the
// browser showed that failure even though the first request had logged in.
// Fix: remember the response for each code for a few minutes and replay it to
// duplicate requests. Also sends redirect_uri with the token exchange.
import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../../../keystatic.config';

export const prerender = false;

const handler = makeHandler({ config });

type Stored = { status: number; headers: [string, string][]; body: string };
const byCode = new Map<string, { at: number; result: Promise<Stored> }>();
const TTL_MS = 5 * 60 * 1000;

async function run(context: Parameters<APIRoute>[0], redirectUri: string): Promise<Stored> {
  let diag = 'no token request was made';
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith('https://github.com/login/oauth/access_token')) return realFetch(input, init);
    const u = new URL(url);
    if (u.searchParams.has('code') && !u.searchParams.has('redirect_uri')) u.searchParams.set('redirect_uri', redirectUri);
    const res = await realFetch(u, init);
    try {
      const data = await res.clone().json();
      diag = `error=${data.error ?? 'none'}; description=${data.error_description ?? 'none'}`;
    } catch {
      diag = `HTTP ${res.status}; non-JSON response`;
    }
    return res;
  }) as typeof fetch;
  try {
    const res = await handler(context);
    const headers: [string, string][] = [];
    res.headers.forEach((v, k) => { if (k !== 'set-cookie') headers.push([k, v]); });
    for (const c of res.headers.getSetCookie()) headers.push(['set-cookie', c]);
    let body = await res.text();
    if (res.status >= 400) body = `${body}\n\nDetails: ${diag}`;
    return { status: res.status, headers, body };
  } finally {
    globalThis.fetch = realFetch;
  }
}

export const ALL: APIRoute = async (context) => {
  const reqUrl = new URL(context.request.url);
  const code = reqUrl.searchParams.get('code');
  const redirectUri = `${reqUrl.origin}/api/keystatic/github/oauth/callback`;

  const now = Date.now();
  for (const [k, v] of byCode) if (now - v.at > TTL_MS) byCode.delete(k);

  let entry = code ? byCode.get(code) : undefined;
  if (!entry) {
    entry = { at: now, result: run(context, redirectUri) };
    if (code) byCode.set(code, entry);
  }
  const stored = await entry.result;
  const headers = new Headers();
  for (const [k, v] of stored.headers) headers.append(k, v);
  return new Response(stored.body, { status: stored.status, headers });
};
