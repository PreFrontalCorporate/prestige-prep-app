import { revalidatePath } from "next/cache";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const pExecFile = promisify(execFile);

// ---- config (paths are for your VM user) ----
const CURRICULUM_DIR = "/home/donkey_right_productions/prestige-prep-curriculum";
const RUNNER = path.join(CURRICULUM_DIR, "run_agent.sh");
const REPORTS_DIR = path.join(CURRICULUM_DIR, ".agent/reports");
const RUN_JSON = path.join(CURRICULUM_DIR, ".agent/run.json");
const RUN_PID = path.join(CURRICULUM_DIR, ".agent/run.pid");

// ---- helpers ----
async function newestLog(): Promise<string | null> {
  try {
    const files = (await readdir(REPORTS_DIR)).filter(
      (f) => f.startsWith("generate-") && f.endsWith(".log")
    );
    if (!files.length) return null;
    const withTime = await Promise.all(
      files.map(async (f) => ({
        f,
        mtime: (await stat(path.join(REPORTS_DIR, f))).mtimeMs,
      }))
    );
    withTime.sort((a, b) => b.mtime - a.mtime);
    return path.join(REPORTS_DIR, withTime[0].f);
  } catch {
    return null;
  }
}

async function fileExists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readTail(filePath: string, maxBytes = 8000) {
  const buf = await readFile(filePath);
  const start = Math.max(0, buf.length - maxBytes);
  return buf.toString("utf8", start);
}

async function pidLive(pid: string) {
  try {
    const { stdout } = await pExecFile("bash", ["-lc", `ps -p ${pid} -o pid=`]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function parseSetFromLogTail(tail: string): string | null {
  const m = tail.match(/Start set=([^\s]+)/);
  return m ? m[1] : null;
}

function finishedFromTail(tail: string): boolean {
  return tail.includes("## FINISHED");
}

// ---- server actions (NOT exported) ----
async function startAction(formData: FormData) {
  "use server";
  const set = (formData.get("set") || "").toString().trim();
  const scale = (formData.get("scale") || "10").toString().trim();

  await pExecFile("bash", ["-lc", `${RUNNER}`], {
    env: {
      ...process.env,
      ...(set ? { SET_NAME: set } : {}),
      SCALE: scale,
    },
  });

  revalidatePath("/admin/agent");
}

async function stopAction() {
  "use server";
  if (await fileExists(RUN_PID)) {
    const pid = (await readFile(RUN_PID, "utf8")).trim();
    if (pid) {
      await pExecFile("bash", ["-lc", `kill ${pid} || true`]);
    }
  }
  revalidatePath("/admin/agent");
}

async function importAction(formData: FormData) {
  "use server";
  let setFromRunJson: string | null = null;
  if (await fileExists(RUN_JSON)) {
    try {
      const j = JSON.parse(await readFile(RUN_JSON, "utf8"));
      setFromRunJson = j?.set ?? null;
    } catch {}
  }

  const log = await newestLog();
  let set = (formData.get("set") || "").toString().trim() || setFromRunJson || "";
  if (!set && log) {
    const tail = await readTail(log);
    set = parseSetFromLogTail(tail) || "";
  }
  if (!set) throw new Error("Could not determine set name.");

  await fetch("http://127.0.0.1:3000/api/loadSet?set=" + encodeURIComponent(set), {
    method: "GET",
  });

  revalidatePath("/admin/agent");
}

// ---- page (server component) ----
export default async function AgentAdminPage() {
  const logPath = await newestLog();
  const tail = logPath ? await readTail(logPath) : "(no log yet)";
  const setInTail = logPath ? parseSetFromLogTail(tail) || "—" : "—";
  const isFinished = finishedFromTail(tail);

  let pid = "—";
  let alive = false;
  if (await fileExists(RUN_PID)) {
    try {
      const rawPid = (await readFile(RUN_PID, "utf8")).trim();
      if (rawPid) {
        pid = rawPid;
        alive = await pidLive(rawPid);
      }
    } catch {}
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Agent Control</h1>

      <section className="space-y-2">
        <div>
          <b>PID:</b> {pid} {alive ? "🟢 running" : "⚪ stopped"}
        </div>
        <div>
          <b>Current/last set:</b> {setInTail}
        </div>
        <div>
          <b>Log file:</b> {logPath ?? "—"}
        </div>
        <div>
          <b>Status:</b> {isFinished ? "✅ FINISHED" : alive ? "⏳ In progress" : "—"}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form action={startAction} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
          <h2 className="font-medium">Start new run</h2>
          <label className="block text-sm">
            Set name (optional):
            <input
              name="set"
              className="border rounded px-2 py-1 w-full"
              placeholder="sat-auto-YYYYMMDD-HHMMSS"
            />
          </label>
          <label className="block text-sm">
            Scale (default 10):
            <input name="scale" defaultValue="10" className="border rounded px-2 py-1 w-24" />
          </label>
          <button className="px-3 py-1 rounded bg-black text-white">Start Agent</button>
        </form>

        <form action={stopAction} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
          <h2 className="font-medium">Stop</h2>
          <p className="text-sm text-gray-600">Send SIGTERM to the current PID (if any).</p>
          <button className="px-3 py-1 rounded bg-red-600 text-white">Stop Agent</button>
        </form>

        <form
          action={importAction}
          className="border rounded-xl p-4 space-y-3 bg-white shadow-sm md:col-span-2"
        >
          <h2 className="font-medium">Import into App</h2>
          <p className="text-sm text-gray-600">
            Uses the latest set name (from run.json/log). You can override below.
          </p>
          <input
            name="set"
            className="border rounded px-2 py-1 w-full"
            placeholder={setInTail || "set-name"}
          />
          <button className="px-3 py-1 rounded bg-indigo-600 text-white">
            Import (calls /api/loadSet)
          </button>
        </form>
      </section>

      <section className="border rounded-xl p-4 bg-white shadow-sm">
        <h2 className="font-medium mb-2">Live Log (tail)</h2>
        <pre className="text-xs whitespace-pre-wrap max-h-[60vh] overflow-auto">{tail}</pre>
        <div className="mt-2 text-sm text-gray-500">Reload the page to refresh.</div>
      </section>
    </main>
  );
}
