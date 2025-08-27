// app/admin/web/page.tsx
import "server-only";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
const pexec = promisify(execFile);

export const dynamic = "force-dynamic";

const BASE = process.env.HOME
  ? path.join(process.env.HOME, "prestige-prep-app")
  : process.cwd();
const RUNNER = path.join(BASE, ".agent-web/run_webagent.sh");
const STOPPER = path.join(BASE, ".agent-web/stop_webagent.sh");
const PIDFILE = path.join(BASE, ".agent-web/run_webagent.pid");

async function readPid(): Promise<number | null> {
  try {
    const { stdout } = await pexec("bash", ["-lc", `cat "${PIDFILE}"`]);
    const pid = parseInt(stdout.trim(), 10);
    if (!Number.isFinite(pid)) return null;
    // ensure it's alive
    await pexec("bash", ["-lc", `ps -p ${pid} >/dev/null 2>&1 && echo alive || echo dead`]);
    return pid;
  } catch {
    return null;
  }
}

async function startAgent(formData: FormData) {
  "use server";
  const model = String(formData.get("model") || "gemini-2.5-pro");
  const iters = String(formData.get("iters") || "25");
  const timeout = String(formData.get("timeout") || "9000");
  const goals = String(formData.get("goals") || "");
  // Pass env through so the runner can see model/iters/timeout/goals
  await new Promise<void>((resolve, reject) => {
    const child = spawn("bash", ["-lc", `"${RUNNER}"`], {
      stdio: "ignore",
      env: {
        ...process.env,
        MODEL: model,
        ITERS: iters,
        TIMEOUT: timeout,
        GOALS_TEXT: goals,
      },
      shell: true,
    });
    child.on("error", reject);
    child.on("exit", () => resolve());
  });
  revalidatePath("/admin/web");
}

async function stopAgent() {
  "use server";
  // soft stop via provided script
  await new Promise<void>((resolve) => {
    const child = spawn("bash", ["-lc", `"${STOPPER}"`], { stdio: "ignore", shell: true });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
  revalidatePath("/admin/web");
}

async function publishToVM() {
  "use server";
  // Build and restart systemd unit (passwordless sudo already set up)
  await new Promise<void>((resolve) => {
    const cmd = `
      cd "${BASE}" && \
      pnpm build && \
      sudo /usr/bin/systemctl restart prestige-prep
    `;
    const child = spawn("bash", ["-lc", cmd], { stdio: "ignore", shell: true });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}

async function commitAndPush(formData: FormData) {
  "use server";
  const branch = String(formData.get("branch") || "");
  const msg = String(formData.get("message") || "web-agent: patch ...");
  const branchName = branch || `agent-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
  const cmd = `
    cd "${BASE}" && \
    git checkout -B "${branchName}" && \
    git add -A && \
    git commit -m "${msg.replace(/"/g, '\\"')}" || true && \
    git push -u origin "${branchName}" --force
  `;
  await pexec("bash", ["-lc", cmd]);
}

export default async function Page() {
  const pid = await readPid();
  const running = !!pid;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Web Agent (Next.js)</h1>

      <div className="rounded-xl border p-4 grid gap-3">
        <div>PID: {running ? <span className="text-green-600">{pid} 🟢 running</span> : <span className="text-gray-500">— ⚪ stopped</span>}</div>
        <div>Branch: <code>main</code></div>

        <form action={startAgent} className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Model</span>
              <input name="model" defaultValue="gemini-2.5-pro" className="border rounded px-2 py-1"/>
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Iters</span>
              <input name="iters" defaultValue="25" className="border rounded px-2 py-1"/>
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Timeout (s)</span>
              <input name="timeout" defaultValue="9000" className="border rounded px-2 py-1"/>
            </label>
          </div>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Goals</span>
            <textarea
              name="goals"
              rows={10}
              defaultValue={`Implement the following features, iterating with small, safe patches until \`pnpm build\` passes and basic flows work:

1) Learning Methodologies Pages
   - Create a top page at /methods listing these methodologies with short descriptions:
     • Active Recall • Spaced Repetition • Interleaving • Deliberate Practice • Mastery Learning • Worked Examples • Fading (Scaffold Reduction) • Retrieval Practice (with confidence) • Timed Drills & Benchmarks • Error Logging & Reflection
   - Each links to /methods/[slug] with a lightweight explainer and how the app supports it.

2) Time & Score Tracking
   - Track per-item attempts: sessionId (cookie), setId, itemId, section, tags, difficulty, chosen answer, correctness, elapsedMs, timestamp.
   - Persist to Firestore via lib/firestore.ts in collection "attempts" -> doc(sessionId) -> subcollection "events".
   - Add minimal server actions from /drills to record attempts (avoid public /api where possible).

3) Fast Content Picker
   - Add a quick picker on /drills (and/or /dashboard) to switch the current content set immediately using existing loader logic.

4) Recommended Learning (from mistakes)
   - Aggregate recent attempts (e.g., last 50) and rank weak areas by section/tag and difficulty.
   - Add /recommended that shows top weak areas and links to focused drills (or at least presents suggested scopes).

5) KaTeX & Polish
   - Integrate KaTeX to render LaTeX in items/explanations (minimal deps).
   - Gentle UI polish: spacing, headings, small quality-of-life improvements. Keep changes incremental.

Guardrails:
- Small diffs only; keep existing features stable. Use server actions over public API. Keep TypeScript strict. Ensure \`pnpm build\` stays green.`}
              className="border rounded px-2 py-1 font-mono text-sm"
            />
          </label>

          <div className="flex gap-2">
            <button className="rounded bg-black text-white px-3 py-1">Start</button>
            <form action={stopAgent}>
              <button className="rounded bg-gray-700 text-white px-3 py-1" formAction={stopAgent}>Stop</button>
            </form>
          </div>
        </form>
      </div>

      <form action={publishToVM} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Publish latest changes to VM</h2>
        <p className="text-sm text-gray-600">Runs <code>pnpm build</code> and then <code>systemctl restart prestige-prep</code>.</p>
        <button className="rounded bg-indigo-600 text-white px-3 py-1">Publish to VM</button>
      </form>

      <form action={commitAndPush} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Commit & Push (create/overwrite branch)</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Branch</span>
            <input name="branch" placeholder="agent-YYYYMMDDHHMMSS" className="border rounded px-2 py-1"/>
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Commit message</span>
            <input name="message" defaultValue="web-agent: patch ..." className="border rounded px-2 py-1"/>
          </label>
        </div>
        <button className="rounded bg-emerald-600 text-white px-3 py-1">Commit & Push</button>
      </form>

      {/* Live Log */}
      <LiveLog />
    </div>
  );
}

/** -------- Client log viewer -------- */
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

function LiveLog() {
  "use client";
  const [lines, setLines] = require("react").useState<string[]>([]);
  const [file, setFile] = require("react").useState<string | null>(null);
  const [startedAt, setStartedAt] = require("react").useState<string | null>(null);
  const [mtime, setMtime] = require("react").useState<string | null>(null);
  const [tick, setTick] = require("react").useState(0);

  // poll every 2s
  require("react").useEffect(() => {
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
      } catch {}
      if (alive) setTimeout(loop, 2000);
    };
    loop();
    return () => { alive = false; };
  }, []);

  // tick to re-render elapsed every second
  require("react").useEffect(() => {
    const t = setInterval(() => setTick((x: number) => x + 1), 1000);
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
