// app/api/webagent/pushItems/route.ts
import { NextResponse } from "next/server";
import { writeJsonFile } from "@/lib/gcs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST,OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
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

    const setName: string | undefined = body.setName || body.set || body.name;
    const items: any[] | undefined = body.items;

    if (!setName) {
      return NextResponse.json({ ok: false, error: "Missing setName" }, { status: 400, headers: CORS });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "items[] required" }, { status: 400, headers: CORS });
    }

    const exam: string = body.index?.exam || items[0]?.exam || "SAT";
    const index = { name: setName, exam, count: items.length };

    const draftItems = `drafts/${setName}/items.json`;
    const draftIndex = `drafts/${setName}/index.json`;

    await writeJsonFile(draftItems, items);
    await writeJsonFile(draftIndex, index);

    return NextResponse.json(
      { ok: true, draft: { items: draftItems, index: draftIndex }, index },
      { headers: CORS }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500, headers: CORS });
  }
}
