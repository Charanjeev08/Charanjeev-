// TEMPORARY: checks how GitHub responds to a deliberately wrong secret. Delete after diagnosis.
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
export const prerender = false;
export const GET: APIRoute = async () => {
  const id = getSecret('KEYSTATIC_GITHUB_CLIENT_ID') ?? '';
  const secret = getSecret('KEYSTATIC_GITHUB_CLIENT_SECRET') ?? '';
  const call = async (s: string) => {
    const u = new URL('https://github.com/login/oauth/access_token');
    u.searchParams.set('client_id', id);
    u.searchParams.set('client_secret', s);
    u.searchParams.set('code', 'fake');
    const r = await fetch(u, { method: 'POST', headers: { Accept: 'application/json' } });
    const d = await r.json();
    return `${d.error}`;
  };
  const lines = [
    `client_id length=${id.length} startsWithIv=${id.startsWith('Iv')} trimmedSame=${id === id.trim()}`,
    `secret length=${secret.length} trimmedSame=${secret === secret.trim()}`,
    `with real secret: ${await call(secret)}`,
    `with wrong secret: ${await call('wrong')}`,
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain' } });
};
