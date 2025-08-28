// app/api/webagent/readDraft/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readJson, exists } from "@/lib/gcs";

function cors(headers: Headers) {
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-headers", "content-type, authorization");
  headers.set("access-control-allow-methods", "GET,OPTIONS");
}

function assertAgent(req: NextRequest): NextResponse | null {
  const want = process.env.AGENT_TOKEN;
  if (!want) return null; // unsecured if you didn't set it
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

export async function GET(req: NextRequest) {
  const unauthorized = assertAgent(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const setName = searchParams.get("set") || searchParams.get("setName");
  const file = searchParams.get("file") || "items.json";
  if (!setName) {
    const res = NextResponse.json({ ok: false, error: "Missing set/setName" }, { status: 400 });
    cors(res.headers);
    return res;
  }

  const base = `drafts/${setName}`;
  const path = `${base}/${file}`;
  if (!(await exists(path))) {
    const res = NextResponse.json({ ok: false, error: `Not found: ${path}` }, { status: 404 });
    cors(res.headers);
    return res;
  }

  const data = await readJson(path);
  const res = NextResponse.json({ ok: true, set: setName, path, data });
  cors(res.headers);
  return res;
}
