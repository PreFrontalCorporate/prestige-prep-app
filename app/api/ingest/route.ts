import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { gcsPath: string; count?: number };
    if (!body.gcsPath) return new NextResponse("gcsPath required", { status: 400 });
    const doc = { gcsPath: body.gcsPath, count: body.count ?? 0, createdAt: new Date().toISOString() };
    const ref = await db.collection("contentSets").add(doc);
    return NextResponse.json({ id: ref.id });
  } catch (e:any) {
    return new NextResponse(e?.message ?? "error", { status: 500 });
  }
}
