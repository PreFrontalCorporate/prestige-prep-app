// app/api/loadSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { readTextFile } from "@/lib/gcs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const set = searchParams.get("set");
  if (!set) {
    return NextResponse.json({ ok: false, error: "missing set" }, { status: 400 });
  }

  let count = 0;
  try {
    const metaText = await readTextFile(`content/sets/${set}/metadata.json`);
    const meta = JSON.parse(metaText);
    count = Number(meta?.count || 0);
  } catch {
    try {
      const itemsText = await readTextFile(`content/sets/${set}/items.jsonl`);
      count = itemsText.split(/\r?\n/).filter(Boolean).length;
    } catch {
      // keep count=0
    }
  }

  // Persist runtime marker (works across serverless invocations)
  try {
    await db
      .collection("runtime")
      .doc("currentSet")
      .set({ id: set, count, updatedAt: Date.now() }, { merge: true });
  } catch {
    // non-fatal
  }

  // Set a cookie so the browser carries the choice around
  const res = NextResponse.json({ ok: true, set, count });
  res.cookies.set("pp-set", set, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30d
  });
  return res;
}
