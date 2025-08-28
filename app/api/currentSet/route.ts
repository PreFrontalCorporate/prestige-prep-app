// app/api/currentSet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let set: string | null = null;

  try {
    const snap = await db.collection("meta").doc("currentSet").get();
    if (snap.exists) set = (snap.data() as any)?.set ?? null;
  } catch {
    set = (globalThis as any).__CURRENT_SET__ ?? null;
  }

  return NextResponse.json({ set });
}
