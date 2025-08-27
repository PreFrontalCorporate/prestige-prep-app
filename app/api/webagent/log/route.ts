// app/api/webagent/log/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

const DEFAULT_DIR = process.env.WEBAGENT_REPORT_DIR ||
  path.join(process.env.HOME || "/home/donkey_right_productions", "prestige-prep-app/.agent-web/reports");

// Parse YYYYMMDD-HHMMSS from webagent-YYYYMMDD-HHMMSS.log
function parseStamp(name: string): string | null {
  const m = name.match(/webagent-(\d{8}-\d{6})\.log$/);
  if (!m) return null;
  const s = m[1];
  const iso = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`;
  return iso;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dir = url.searchParams.get("dir") || DEFAULT_DIR;
    const limit = Number(url.searchParams.get("limit") || "600"); // ~last 600 lines
    const fileParam = url.searchParams.get("file");

    const entries = await fs.readdir(dir).catch(() => []);
    const logs = entries.filter((f) => f.endsWith(".log")).sort();
    if (!logs.length) {
      return NextResponse.json({ ok: true, file: null, lines: [], startedAt: null });
    }

    const file = fileParam && logs.includes(fileParam) ? fileParam : logs[logs.length - 1];
    const full = path.join(dir, file);
    const buf = await fs.readFile(full, "utf8");
    const lines = buf.trimEnd().split(/\r?\n/);
    const tail = lines.slice(-limit);

    const stat = await fs.stat(full);
    const startedAt = parseStamp(file);

    return NextResponse.json({
      ok: true,
      dir,
      file,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      startedAt,
      lines: tail,
    }, { headers: { "cache-control": "no-store" }});
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
