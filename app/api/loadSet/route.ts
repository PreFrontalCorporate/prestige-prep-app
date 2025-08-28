// app/api/loadSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { readTextFile } from "@/lib/gcs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function ok(body: any, init: number = 200) {
  return new NextResponse(JSON.stringify(body), {
    status: init,
    headers: { "content-type": "application/json", ...CORS },
  });
}
function bad(msg: string, init: number = 400) {
  return ok({ ok: false, error: msg }, init);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function doLoad(setName: string) {
  // verify the set exists by fetching its index.json from GCS
  const path = `sets/${setName}/index.json`;
  const raw = await readTextFile(path);
  const meta = JSON.parse(raw) as { name?: string; exam?: string; count?: number };

  // persist “current set” to Firestore
  await db.collection("meta").doc("current").set(
    {
      set: setName,
      updatedAt: Date.now(), // serverTimestamp not necessary for simple admin
    },
    { merge: true }
  );

  return { ok: true, set: setName, meta, path };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const set = url.searchParams.get("set");
    if (!set) return bad("Missing ?set=");
    const result = await doLoad(set);
    return ok(result);
  } catch (e: any) {
    return bad(e?.message || "failed", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const set = body.set || body.setName || new URL(req.url).searchParams.get("set");
    if (!set) return bad("Missing set / setName");
    const result = await doLoad(set);
    return ok(result);
  } catch (e: any) {
    return bad(e?.message || "failed", 500);
  }
}
