// app/api/webagent/log/route.ts
import { NextRequest, NextResponse } from "next/server";
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

  const entry = {
    ts: Date.now(),
    level: body?.level || "info",
    message: body?.message || "",
    meta: body?.meta || {},
  };

  try {
    await db.collection("agentLogs").add(entry);
  } catch (e) {
    console.log("[agent log]", entry);
  }

  const res = NextResponse.json({ ok: true });
  cors(res.headers);
  return res;
}
