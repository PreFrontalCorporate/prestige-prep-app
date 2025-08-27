"use client";

import { useState } from "react";

export default function AttendancePage() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function checkIn() {
    setStatus("idle");
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="container-narrow space-y-6">
      <h1 className="h1">Attendance</h1>
      <p className="text-slate-600">Track streaks, missed days, and strict locks.</p>

      <div className="pp-card p-6 flex items-center gap-4">
        <button onClick={checkIn} className="pp-btn-primary text-base px-6 py-3">
          ✅ Check In for Today
        </button>
        {status === "ok" && <span className="text-brand-700">Checked in!</span>}
        {status === "err" && <span className="text-rose-600">Check-in failed.</span>}
      </div>
    </div>
  );
}
