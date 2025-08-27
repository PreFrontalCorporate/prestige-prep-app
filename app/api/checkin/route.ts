import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export async function POST() {
  try {
    const uid = "demo-user";
    const today = new Date().toISOString().slice(0,10);
    await db.collection("users").doc(uid).collection("attendance").doc(today).set({
      date: today, checkedInAt: new Date().toISOString(), strict: true
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return new NextResponse(e?.message ?? "error", { status: 500 });
  }
}
