// app/api/currentSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(body: any, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

const G: any = globalThis as any;
if (!G.__pp_mem) G.__pp_mem = {};
if (!("currentSet" in G.__pp_mem)) G.__pp_mem.currentSet = null as string | null;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    // prefer Firestore
    const snap = await db.collection("meta").doc("current").get();
    const set = snap.exists ? (snap.data()?.set as string | null) : G.__pp_mem.currentSet ?? null;
    return json({ set: set ?? null });
  } catch {
    // fallback to in-memory
    return json({ set: G.__pp_mem.currentSet ?? null });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const set = body.set || body.setName;
    if (!set) return json({ ok: false, error: "Missing set/setName" }, 400);

    // write both places
    await db.collection("meta").doc("current").set(
      {
        set,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    G.__pp_mem.currentSet = set;

    return json({ ok: true, set });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "failed" }, 500);
  }
}
