// app/api/webagent/log/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const BASE = "/home/donkey_right_productions/prestige-prep-app";
const REPORTS = path.join(BASE, ".agent-web", "reports");

async function newest(): Promise<string | null> {
  try {
    const entries = await fs.readdir(REPORTS);
    if (!entries.length) return null;
    const stats = await Promise.all(
      entries.map(async (name) => {
        const p = path.join(REPORTS, name);
        const st = await fs.stat(p);
        return { p, m: st.mtimeMs };
      })
    );
    stats.sort((a, b) => b.m - a.m);
    return stats[0]?.p ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");
  const n = Math.max(1, Math.min(2000, Number(searchParams.get("n") || "300")));

  let target = file || (await newest());

  if (!target || !fssync.existsSync(target)) {
    return NextResponse.json({ file: null, lines: [] });
  }

  let text = "";
  try {
    text = await fs.readFile(target, "utf8");
  } catch {
    // file may be rotating
    return NextResponse.json({ file: target, lines: [] });
  }

  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const lines = raw.slice(Math.max(0, raw.length - n));

  // try to parse start time from first "Start" line
  const startLine = raw.find((l) => l.includes("Start"));
  let startedAt: string | null = null;
  const m = startLine?.match(/\[(WEBAGENT|AGENT)\]\s+(\d{4}-\d{2}-\d{2}T[^\s]+)/);
  if (m) startedAt = m[2];

  const st = await fs.stat(target);
  return NextResponse.json({
    file: target,
    mtime: st.mtime.toISOString(),
    startedAt,
    lines,
  });
}
