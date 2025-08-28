// app/api/buildSet/route.ts
import { NextResponse } from "next/server";
import { bucket, copyObject, exists, readTextFile, writeJsonFile } from "@/lib/gcs";
import { db } from "@/lib/firestore";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data }, { headers: CORS });
}
function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code, headers: CORS });
}

async function build(setName: string) {
  const dItems = `drafts/${setName}/items.json`;
  const dIndex = `drafts/${setName}/index.json`;
  const sItems = `sets/${setName}/items.json`;
  const sIndex = `sets/${setName}/index.json`;

  // must have draft items
  if (!(await exists(dItems))) throw new Error(`Missing draft items: ${dItems}`);

  // copy items → sets
  await copyObject(dItems, sItems);

  // index: copy if present, else synthesize from items
  if (await exists(dIndex)) {
    await copyObject(dIndex, sIndex);
  } else {
    const items = JSON.parse(await readTextFile(dItems));
    const exam = (items?.[0]?.exam as string) || "SAT";
    const index = { name: setName, exam, count: Array.isArray(items) ? items.length : 0 };
    await writeJsonFile(sIndex, index);
  }

  // persist current set in Firestore
  await db.collection("meta").doc("currentSet").set(
    { set: setName, updatedAt: Date.now() },
    { merge: true }
  );

  // quick sanity (head to avoid full download)
  const [meta] = await bucket.file(sIndex).getMetadata();
  return { set: setName, paths: { sItems, sIndex }, contentType: meta.contentType };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const setName = searchParams.get("set") || searchParams.get("setName");
  if (!setName) return bad("Missing set / setName");
  try {
    const result = await build(setName);
    return ok(result);
  } catch (e: any) {
    return bad(String(e?.message || e), 500);
  }
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let body: any = {};
    if (ct.includes("application/json")) body = await req.json();
    else if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = Object.fromEntries(form as any);
    }
    const setName = body.set || body.setName || body.name;
    if (!setName) return bad("Missing set / setName");
    const result = await build(setName);
    return ok(result);
  } catch (e: any) {
    return bad(String(e?.message || e), 500);
  }
}
