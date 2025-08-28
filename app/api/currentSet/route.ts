import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

function corsHeaders(h?: HeadersInit) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...(h || {}),
  };
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET() {
  try {
    const snap = await db.collection("meta").doc("currentSet").get();
    const set = snap.exists ? (snap.get("set") as string) : null;
    return NextResponse.json({ set }, { headers: corsHeaders() });
  } catch (e: any) {
    return NextResponse.json(
      { set: null, error: String(e?.message || e) },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let set: string | null = null;

    if (ct.includes("application/json")) {
      const b = await req.json();
      set = b.set || b.setName || b.name || null;
    } else if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const f = await req.formData();
      set = (f.get("set") || f.get("setName") || f.get("name")) as
        | string
        | null;
    } else {
      const t = (await req.text()).trim();
      if (t) set = t;
    }

    if (!set) {
      return NextResponse.json(
        { ok: false, error: "Missing set / setName" },
        { status: 400, headers: corsHeaders() }
      );
    }

    await db
      .collection("meta")
      .doc("currentSet")
      .set({ set, updatedAt: new Date() }, { merge: true });

    return NextResponse.json({ ok: true, set }, { headers: corsHeaders() });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500, headers: corsHeaders() }
    );
  }
}
