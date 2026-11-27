// Wrapper around Keystatic's OAuth callback.
// 1. Sends redirect_uri with the token exchange (newer GitHub OAuth checks it).
// 2. TEMPORARY diagnostic: on failure, shows GitHub's error code and whether this
//    code was already seen by this server instance. Never shows token values.
import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../../../keystatic.config';

export const prerender = false;

const handler = makeHandler({ config });
const seenCodes = new Set<string>();

export const ALL: APIRoute = async (context) => {
  const reqUrl = new URL(context.request.url);
  const code = reqUrl.searchParams.get('code') ?? '';
  const seenBefore = seenCodes.has(code);
  seenCodes.add(code);
  const redirectUri = `${reqUrl.origin}/api/keystatic/github/oauth/callback`;

  let diag = 'no token request was made';
  let calls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    let target = input;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isToken = url.startsWith('https://github.com/login/oauth/access_token');
    if (isToken) {
      calls++;
      const u = new URL(url);
      if (u.searchParams.has('code') && !u.searchParams.has('redirect_uri')) {
        u.searchParams.set('redirect_uri', redirectUri);
      }
      target = u;
    }
    const res = await realFetch(target, init);
    if (isToken) {
      try {
        const data = await res.clone().json();
        diag = `HTTP ${res.status}; error=${data.error ?? 'none'}; description=${data.error_description ?? 'none'}; fields=${Object.keys(data).join(',')}`;
      } catch {
        diag = `HTTP ${res.status}; non-JSON response`;
      }
    }
    return res;
  }) as typeof fetch;
  try {
    const res = await handler(context);
    if (res.status >= 400) {
      const body = await res.text();
      return new Response(
        `${body}\n\nDiagnostic: ${diag}; tokenCalls=${calls}; codeSeenBefore=${seenBefore}; method=${context.request.method}; ua=${(context.request.headers.get('user-agent') ?? '').slice(0, 60)}; purpose=${context.request.headers.get('sec-purpose') ?? context.request.headers.get('purpose') ?? 'none'}`,
        { status: res.status, headers: { 'content-type': 'text/plain' } },
      );
    }
    return res;
  } finally {
    globalThis.fetch = realFetch;
  }
};
