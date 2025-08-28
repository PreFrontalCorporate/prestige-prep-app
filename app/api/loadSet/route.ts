// app/api/loadSet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readTextFile } from "@/lib/gcs";
import { db } from "@/lib/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

type Body = { setName?: string };

async function saveCurrentSet(set: string) {
  // Try Firestore first, fall back to process memory (survives per-node)
  try {
    await db.collection("meta").doc("currentSet").set(
      { set, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch {
    (globalThis as any).__CURRENT_SET__ = set;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { setName } = (await req.json()) as Body;
    if (!setName) {
      return NextResponse.json(
        { ok: false, error: "setName required" },
        { status: 400, headers: cors() },
      );
    }

    // Sanity check that the set exists in GCS (throws if not found)
    await readTextFile(`sets/${setName}/index.json`);

    await saveCurrentSet(setName);

    return NextResponse.json({ ok: true, set: setName }, { headers: cors() });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown error" },
      { status: 500, headers: cors() },
    );
  }
}
