"use client";
import React, { useEffect, useState } from "react";

function humanElapsed(startIso?: string | null) {
  if (!startIso) return "—";
  const start = new Date(startIso).getTime();
  const now = Date.now();
  let ms = Math.max(0, now - start);
  const hh = Math.floor(ms / 3600000); ms -= hh * 3600000;
  const mm = Math.floor(ms / 60000); ms -= mm * 60000;
  const ss = Math.floor(ms / 1000);
  return `${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")}:${ss.toString().padStart(2,"0")}`;
}

function timeFmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().replace("T"," ").replace("Z"," UTC");
}

export default function LiveLog() {
  const [lines, setLines] = useState<string[]>([]);
  const [file, setFile] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [mtime, setMtime] = useState<string | null>(null);

  // poll every 2s
  useEffect(() => {
    let alive = true;
    const loop = async () => {
      try {
        const res = await fetch("/api/webagent/log?limit=700", { cache: "no-store" });
        const data = await res.json();
        if (alive && data?.ok) {
          setLines(data.lines || []);
          setFile(data.file || null);
          setStartedAt(data.startedAt || null);
          setMtime(data.mtime || null);
        }
      } catch { /* noop */ }
      if (alive) setTimeout(loop, 2000);
    };
    loop();
    return () => { alive = false; };
  }, []);

  // tick to refresh elapsed every second
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div><span className="text-gray-500">Log:</span> <code>{file ?? "—"}</code></div>
        <div><span className="text-gray-500">Started:</span> {timeFmt(startedAt)}</div>
        <div><span className="text-gray-500">Elapsed:</span> <code>{humanElapsed(startedAt)}</code></div>
        <div><span className="text-gray-500">Updated:</span> {timeFmt(mtime)}</div>
      </div>
      <pre className="border rounded p-3 text-xs overflow-auto max-h-[60vh] leading-5 bg-white">
        {lines.length ? lines.join("\n") : "No logs yet."}
      </pre>
    </div>
  );
}
