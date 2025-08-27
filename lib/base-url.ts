// lib/base-url.ts
// Robust absolute URL builder without importing Next internals.

type HeaderGetter = { get(name: string): string | null } | Headers | undefined;

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

function nonEmpty(v?: string | null) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Resolve origin from env or proxy headers */
export function getOrigin(hdrs?: HeaderGetter): string {
  // 1) Explicit env
  const envURL =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.URL ||
    process.env.NEXTAUTH_URL;
  if (nonEmpty(envURL)) return trimSlash(envURL as string);

  // 2) Vercel convenience
  const vercelURL = process.env.VERCEL_URL;
  if (nonEmpty(vercelURL)) return `https://${trimSlash(vercelURL as string)}`;

  // 3) Proxy headers
  if (hdrs && typeof (hdrs as any).get === 'function') {
    const get = (hdrs as any).get.bind(hdrs) as (k: string) => string | null;
    const proto = get('x-forwarded-proto') || 'https';
    const host = get('x-forwarded-host') || get('host');
    if (nonEmpty(host)) return `${proto}://${host}`;
  }

  // 4) Fallbacks
  return process.env.NODE_ENV === 'production'
    ? 'https://localhost'
    : 'http://localhost:3000';
}

/** Build an absolute URL from a path like '/api/foo' */
export function absoluteUrl(path: string, hdrs?: HeaderGetter): string {
  const origin = getOrigin(hdrs);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
}
