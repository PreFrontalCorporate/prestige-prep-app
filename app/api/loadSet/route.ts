// app/api/loadSet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readTextFile } from "@/lib/gcs";

export const dynamic = "force-dynamic";

type Item = Record<string, any>;

// simple in-memory cache (survives across requests in the same server process)
const g: any = globalThis as any;
if (!g.__CONTENT_CACHE__) {
  g.__CONTENT_CACHE__ = { set: null as string | null, items: [] as Item[], loadedAt: 0 };
}

async function doLoad(setId: string) {
  const path = `content/sets/${setId}/items.jsonl`;
  const text = await readTextFile(path);
  const items = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  g.__CONTENT_CACHE__ = { set: setId, items, loadedAt: Date.now() };
  return { ok: true, set: setId, count: items.length };
}

async function handler(req: NextRequest) {
  try {
    let setId =
      new URL(req.url).searchParams.get("set") || null;

    if (!setId && req.method !== "GET") {
      // try JSON body when POST
      try {
        const b = await req.json();
        setId = b?.set || null;
      } catch {
        // ignore
      }
    }

    if (!setId) {
      return NextResponse.json({ ok: false, error: "Missing set id (?set=)" }, { status: 400 });
    }

    const res = await doLoad(setId);
    return NextResponse.json(res);
  } catch (e: any) {
    console.error("[loadSet] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
