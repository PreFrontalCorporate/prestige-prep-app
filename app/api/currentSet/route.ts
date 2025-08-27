// app/api/currentSet/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const g: any = globalThis as any;
  const c = g.__CONTENT_CACHE__ || { set: null, items: [] };
  return NextResponse.json({ set: c.set, count: c.items?.length || 0 });
}
