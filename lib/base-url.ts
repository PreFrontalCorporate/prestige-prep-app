// lib/base-url.ts
// Robust absolute URL builder for server actions / fetches
import type { Headers as NextHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

/** Resolve an origin string from env or headers */
export function getOrigin(hdrs?: Headers | NextHeaders): string {
  // 1) Explicit override
  const envURL = process.env.NEXT_PUBLIC_BASE_URL;
  if (envURL && envURL.trim()) return trimSlash(envURL.trim());

  // 2) Vercel convenience var (e.g. my-app.vercel.app)
  const vercelURL = process.env.VERCEL_URL;
  if (vercelURL) return `https://${trimSlash(vercelURL)}`;

  // 3) Try forwarded headers (works behind proxies)
  if (hdrs) {
    // @ts-ignore — compatible for both std Headers and NextHeaders
    const proto = hdrs.get?.('x-forwarded-proto');
    // @ts-ignore
    const host = hdrs.get?.('x-forwarded-host') ?? hdrs.get?.('host');
    if (proto && host) return `${proto}://${host}`;
  }

  // 4) Other common envs
  const url = process.env.URL || process.env.NEXTAUTH_URL;
  if (url) return trimSlash(url);

  // 5) Fallback (dev)
  return 'http://localhost:3000';
}

/** Return absolute URL given a path like '/api/foo' */
export function absoluteUrl(path: string, hdrs?: Headers | NextHeaders) {
  const origin = getOrigin(hdrs);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
}
