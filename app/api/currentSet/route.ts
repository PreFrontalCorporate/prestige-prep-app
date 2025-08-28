// app/api/currentSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

// CORS (handy for curl/fetch)
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

export async function GET() {
  try {
    const doc = await db.collection("admin").doc("config").get();
    const set = doc.exists ? (doc.data()?.currentSet ?? null) : null;
    return NextResponse.json({ set }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ set: null, error: e.message ?? String(e) }, { status: 500, headers: cors });
  }
}

export async function POST(req: Request) {
  try {
    const { set } = await req.json();
    if (!set || typeof set !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'set' (string)" }, { status: 400, headers: cors });
    }

    await db.collection("admin").doc("config").set(
      { currentSet: set, updatedAt: Date.now() },
      { merge: true }
    );

    // tiny in-memory cache for faster GET
    (globalThis as any).__currentSet = set;

    return NextResponse.json({ ok: true, set }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500, headers: cors });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: cors });
}
