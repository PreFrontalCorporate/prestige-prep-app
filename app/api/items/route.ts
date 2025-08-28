import { NextRequest, NextResponse } from "next/server";
import { readTextFile } from "@/lib/gcs";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

function corsHeaders(h?: HeadersInit) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...(h || {}),
  };
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Start with any query-provided set name
    let set: string | null =
      url.searchParams.get("set") ||
      url.searchParams.get("setName") ||
      url.searchParams.get("name");

    // Fallback to Firestore meta/currentSet if no set provided
    if (!set) {
      const snap = await db.collection("meta").doc("currentSet").get();
      set = snap.exists ? ((snap.get("set") as string) ?? null) : null;
    }

    if (!set) {
      return NextResponse.json(
        { ok: false, error: "No set specified and no currentSet is set." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const limit = Math.max(
      0,
      Math.min(1000, parseInt(url.searchParams.get("limit") || "0", 10) || 0)
    );
    const offset = Math.max(
      0,
      parseInt(url.searchParams.get("offset") || "0", 10) || 0
    );

    // Load items from GCS
    const path = `sets/${set}/items.json`;
    const json = await readTextFile(path);
    const allItems = JSON.parse(json) as any[];

    const slice =
      limit > 0 ? allItems.slice(offset, offset + limit) : allItems.slice(offset);

    return NextResponse.json(
      { set, count: allItems.length, items: slice },
      { headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500, headers: corsHeaders() }
    );
  }
}
