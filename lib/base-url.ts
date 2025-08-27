// lib/base-url.ts
export function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  const fallback = process.env.BASE_URL?.trim();
  return (fallback || "http://127.0.0.1:3000").replace(/\/$/, "");
}
