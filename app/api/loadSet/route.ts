import { NextRequest, NextResponse } from "next/server";
import { readTextFile } from "@/lib/gcs";
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

function fromUrl(req: NextRequest): string | null {
  const u = new URL(req.url);
  return (
    u.searchParams.get("set") ||
    u.searchParams.get("setName") ||
    u.searchParams.get("name")
  );
}

async function fromBody(req: NextRequest): Promise<string | null> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  try {
    if (ct.includes("application/json")) {
      const body = await req.json();
      return body.set || body.setName || body.name || null;
    }
    if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      return (
        (form.get("set") ||
          form.get("setName") ||
          form.get("name")) as string | null
      );
    }
    // treat raw text body as the set name
    const text = (await req.text()).trim();
    if (text && !text.startsWith("{") && !text.includes("=")) return text;
  } catch {
    // ignore parsing errors — we'll fall through
  }
  return null;
}

function fromReferer(req: NextRequest): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return (
      u.searchParams.get("set") ||
      u.searchParams.get("setName") ||
      u.searchParams.get("name")
    );
  } catch {
    return null;
  }
}

async function resolveSetName(req: NextRequest): Promise<string | null> {
  return fromUrl(req) || (await fromBody(req)) || fromReferer(req);
}

function ok(data: any, init: any = {}) {
  return NextResponse.json(
    { ok: true, ...data },
    { ...init, headers: corsHeaders(init?.headers) }
  );
}
function bad(message: string, init: any = {}) {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 400, ...init, headers: corsHeaders(init?.headers) }
  );
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const set = (await resolveSetName(req))?.trim();
  if (!set) return bad("Missing set / setName");

  try {
    const path = `sets/${set}/index.json`;
    const json = await readTextFile(path);
    const meta = JSON.parse(json);

    // Persist "current set" to Firestore
    await db
      .collection("meta")
      .doc("currentSet")
      .set({ set, updatedAt: new Date() }, { merge: true });

    return ok({ set, meta, path });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500, headers: corsHeaders() }
    );
  }
}
