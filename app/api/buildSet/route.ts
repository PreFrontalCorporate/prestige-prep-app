// app/api/buildSet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { copyObject, exists, readJson, writeJson } from "@/lib/gcs";
import { db } from "@/lib/firestore";

function cors(headers: Headers) {
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-headers", "content-type, authorization");
  headers.set("access-control-allow-methods", "POST,OPTIONS");
}
function assertAgent(req: NextRequest): NextResponse | null {
  const want = process.env.AGENT_TOKEN;
  if (!want) return null;
  const got = req.headers.get("authorization") ?? "";
  const m = got.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== want) {
    const res = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    cors(res.headers);
    return res;
  }
  return null;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  cors(res.headers);
  return res;
}

export async function POST(req: NextRequest) {
  const unauthorized = assertAgent(req);
  if (unauthorized) return unauthorized;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const setName = body?.setName || body?.set;
  if (!setName) {
    const res = NextResponse.json({ ok: false, error: "Missing setName/set" }, { status: 400 });
    cors(res.headers);
    return res;
  }

  const dItems = `drafts/${setName}/items.json`;
  const dIndex = `drafts/${setName}/index.json`;
  if (!(await exists(dItems))) {
    const res = NextResponse.json({ ok: false, error: `Missing draft: ${dItems}` }, { status: 404 });
    cors(res.headers);
    return res;
  }

  // Ensure index has an accurate count
  let indexMeta: any = { name: setName, exam: "SAT", count: 0 };
  if (await exists(dIndex)) {
    indexMeta = await readJson(dIndex);
  }
  try {
    const items: any[] = await readJson(dItems);
    indexMeta.count = items.length;
  } catch {}

  const sItems = `sets/${setName}/items.json`;
  const sIndex = `sets/${setName}/index.json`;

  // Promote
  await copyObject(dItems, sItems);
  await writeJson(sIndex, indexMeta);

  // Persist "current set"
  await db.collection("meta").doc("currentSet").set({ set: setName, at: Date.now() }, { merge: true });

  const res = NextResponse.json({
    ok: true,
    set: setName,
    paths: { sItems, sIndex },
    contentType: "application/json",
  });
  cors(res.headers);
  return res;
}
