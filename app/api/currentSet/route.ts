// app/api/currentSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const fromCookie = cookies().get("pp-set")?.value;
  if (fromCookie) return NextResponse.json({ set: fromCookie });

  try {
    const doc = await db.collection("runtime").doc("currentSet").get();
    if (doc.exists) {
      const data = doc.data() as any;
      return NextResponse.json({ set: data?.id || null, count: data?.count || 0 });
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ set: null, count: 0 });
}
