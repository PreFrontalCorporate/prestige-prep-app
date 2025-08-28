// app/api/webagent/pushItems/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeJson } from "@/lib/gcs";

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

  let body: any;
  try {
    body = await req.json();
  } catch {
    const res = NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    cors(res.headers);
    return res;
  }

  const setName = body?.setName || body?.set;
  const items = body?.items;
  if (!setName || !Array.isArray(items)) {
    const res = NextResponse.json(
      { ok: false, error: "Missing setName and/or items[]" },
      { status: 400 }
    );
    cors(res.headers);
    return res;
  }

  const base = `drafts/${setName}`;
  const itemsPath = `${base}/items.json`;
  const indexPath = `${base}/index.json`;

  // Minimal index metadata
  const count = items.length;
  const exam = items[0]?.exam || "SAT";

  await writeJson(itemsPath, items);
  await writeJson(indexPath, { name: setName, exam, count });

  const res = NextResponse.json({
    ok: true,
    draft: { items: itemsPath, index: indexPath },
    index: { name: setName, exam, count },
  });
  cors(res.headers);
  return res;
}
