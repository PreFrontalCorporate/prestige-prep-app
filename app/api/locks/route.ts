import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

/**
 * GET /api/locks
 * Returns whether drills are unlocked for "today" based on attendance check-in.
 * Uses a demo user id for now; we can wire auth later.
 */
export async function GET() {
  try {
    const uid = "demo-user";
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("attendance")
      .doc(today)
      .get();

    if (!doc.exists) {
      return NextResponse.json({
        canDrill: false,
        reason: "No check-in for today. Please check in first.",
      });
    }
    return NextResponse.json({ canDrill: true });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "error", { status: 500 });
  }
}
