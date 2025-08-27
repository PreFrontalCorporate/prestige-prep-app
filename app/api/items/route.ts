// app/api/items/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const g: any = globalThis as any;
  const cache = g.__CONTENT_CACHE__ || { set: null, items: [] as any[] };
  const url = new URL(req.url);
  const limit = Math.max(0, parseInt(url.searchParams.get("limit") || "0", 10));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

  let items = cache.items || [];
  if (offset) items = items.slice(offset);
  if (limit) items = items.slice(0, limit);

  return NextResponse.json({
    set: cache.set,
    count: (cache.items || []).length,
    items,
  });
}
