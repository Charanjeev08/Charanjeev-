// TEMPORARY diagnostic wrapper around Keystatic's OAuth callback.
// When login fails, it shows GitHub's error code and which fields came back,
// never any token or secret values. Delete once login works.
import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../../../keystatic.config';

export const prerender = false;

const handler = makeHandler({ config });

export const ALL: APIRoute = async (context) => {
  let diag = 'no token request was made';
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await realFetch(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('https://github.com/login/oauth/access_token')) {
      try {
        const data = await res.clone().json();
        diag = `HTTP ${res.status}; error=${data.error ?? "none"}; description=${data.error_description ?? "none"}; fields=${Object.keys(data).join(',')}`;
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
      return new Response(`${body}\n\nDiagnostic: ${diag}`, { status: res.status, headers: { 'content-type': 'text/plain' } });
    }
    return res;
  } finally {
    globalThis.fetch = realFetch;
  }
};
