"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TailResponse = {
  file: string | null;
  mtime?: string | null;
  startedAt?: string | null;
  lines: string[];
};

export default function LiveLog({ pollMs = 1500 }: { pollMs?: number }) {
  const [data, setData] = useState<TailResponse>({ file: null, lines: [] });
  const [elapsed, setElapsed] = useState<string>("-");
  const lastPoll = useRef<number>(0);

  // pretty elapsed for startedAt (if present)
  useEffect(() => {
    const t = setInterval(() => {
      if (!data.startedAt) return setElapsed("-");
      const start = new Date(data.startedAt).getTime();
      const now = Date.now();
      const s = Math.max(0, Math.floor((now - start) / 1000));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      setElapsed(`${h}h ${m}m ${ss}s`);
    }, 1000);
    return () => clearInterval(t);
  }, [data.startedAt]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const url = `/api/webagent/log?n=300&_t=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as TailResponse;
        if (!cancelled) setData(j);
      } catch {}
    }
    // initial + interval
    poll();
    const t = setInterval(() => {
      if (Date.now() - lastPoll.current >= pollMs) {
        lastPoll.current = Date.now();
        poll();
      }
    }, pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pollMs]);

  const prettyMtime = useMemo(() => {
    if (!data.mtime) return "-";
    try {
      const d = new Date(data.mtime);
      return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    } catch {
      return "-";
    }
  }, [data.mtime]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Elapsed: <span className="font-mono">{elapsed}</span> • Updated:{" "}
        <span className="font-mono">{prettyMtime}</span>
      </div>
      <pre className="bg-black text-green-300 text-xs leading-5 p-3 rounded-lg overflow-auto max-h-[480px]">
        {data.lines.join("\n") || "No output yet…"}
      </pre>
    </div>
  );
}
