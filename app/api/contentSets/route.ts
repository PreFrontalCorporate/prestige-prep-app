// app/api/contentSets/route.ts
import { NextResponse } from "next/server";
import { listIndexJsonUnderSets, readTextFile } from "@/lib/gcs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await listIndexJsonUnderSets();
    const sets: any[] = [];
    for (const e of entries) {
      try {
        const txt = await readTextFile(e.path);
        const meta = JSON.parse(txt);
        sets.push({
          name: meta.name || e.name,
          exam: meta.exam || null,
          count: meta.count ?? null,
          path: e.path,
        });
      } catch {
        // skip bad json
      }
    }
    // sort newest first if names are timestamps, else leave as-is
    return NextResponse.json({ sets });
  } catch (e: any) {
    return NextResponse.json({ sets: [], error: String(e?.message || e) });
  }
}
