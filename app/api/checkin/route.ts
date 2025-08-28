// app/api/checkin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { status = "present", note = "" } = body ?? {};

    const doc = {
      email: session.user.email,
      name: session.user.name ?? null,
      status,
      note,
      ts: new Date().toISOString(),
      ua: (req.headers.get("user-agent") ?? "").slice(0, 512),
      ip: req.headers.get("x-forwarded-for") ?? null,
    };

    await db.collection("checkins").add(doc);

    return NextResponse.json({ ok: true, saved: doc });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
