"use client";
import { useState } from "react";

export default function Attendance() {
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");
  async function checkIn() {
    try {
      const r = await fetch("/api/checkin", { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }
  return (
    <main className="p-8 space-y-3">
      <h2 className="text-2xl font-semibold">Attendance</h2>
      <p>Track streaks, missed days, and strict locks.</p>
      <div className="p-4 bg-white rounded shadow">
        <button onClick={checkIn} className="mt-2 px-3 py-1 rounded bg-black text-white">Check In</button>
        {status === "ok" && <p className="text-green-600 mt-2">Checked in ✅</p>}
        {status === "err" && <p className="text-red-600 mt-2">Failed to check in ❌</p>}
      </div>
    </main>
  );
}
