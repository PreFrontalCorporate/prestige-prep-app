// app/api/items/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readTextFile } from "@/lib/gcs";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

async function getSetFromRuntime(): Promise<string | null> {
  try {
    const doc = await db.collection("runtime").doc("currentSet").get();
    return doc.exists ? (doc.data()?.id as string) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit") ?? "";
  const limit = Math.max(0, Math.min(Number(limitRaw || "0"), 1000));

  const setFromQuery = searchParams.get("set");
  const setFromCookie = cookies().get("pp-set")?.value;
  const set = setFromQuery || setFromCookie || (await getSetFromRuntime());

  if (!set) {
    return NextResponse.json({ set: null, count: 0, items: [] });
  }

  try {
    const text = await readTextFile(`content/sets/${set}/items.jsonl`);
    const lines = text.split(/\r?\n/).filter(Boolean);
    const parsed = lines.map((l) => JSON.parse(l));
    const items = limit ? parsed.slice(0, limit) : parsed;
    return NextResponse.json({ set, count: parsed.length, items });
  } catch (e: any) {
    return NextResponse.json({
      set,
      count: 0,
      items: [],
      error: String(e?.message || e),
    });
  }
}
