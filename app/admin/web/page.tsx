// app/admin/web/page.tsx
import fs from "node:fs/promises";
import path from "node:path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import LiveLog from "./LiveLog.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const exec = promisify(execCb);

// ----- VM-specific paths (adjust if needed)
const BASE = "/home/donkey_right_productions/prestige-prep-app";
const AGENT_DIR = path.join(BASE, ".agent-web");
const PID_FILE = path.join(AGENT_DIR, "run.pid");
const GOALS_FILE = path.join(AGENT_DIR, "goals.txt");

// ----- helpers
async function sh(cmd: string) {
  // run via bash -lc for && and env expansion
  return exec(cmd, { shell: "/bin/bash" });
}

async function readpid(): Promise<number | null> {
  try {
    const s = await fs.readFile(PID_FILE, "utf8");
    const n = parseInt(s.trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function newestLogPath(): Promise<string | null> {
  try {
    const reports = path.join(AGENT_DIR, "reports");
    const entries = await fs.readdir(reports);
    if (!entries.length) return null;
    const stats = await Promise.all(
      entries.map(async (name) => {
        const p = path.join(reports, name);
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

// ----- default goals text (pre-fill)
const defaultGoals = `Implement the following features, iterating with small, safe patches until \`pnpm build\` passes and basic flows work:

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
- Small diffs only; keep existing features stable. Use server actions over public API. Keep TypeScript strict. Ensure \`pnpm build\` stays green.
`;

// ====== SERVER ACTIONS ======

async function startAction(formData: FormData) {
  "use server";
  const model = String(formData.get("model") || "gemini-2.5-pro");
  const iters = String(formData.get("iters") || "25");
  const timeout = String(formData.get("timeout") || "9000");
  const goals = String(formData.get("goals") || defaultGoals);

  await fs.mkdir(AGENT_DIR, { recursive: true });
  await fs.writeFile(GOALS_FILE, goals, "utf8");

  // Use the provided runner script which calls web_agent.py
  // and writes logs into .agent-web/reports/*.log and PID into run.pid.
  const logName = `webagent-$(date +%Y%m%d-%H%M%S).log`;
  const cmd = [
    `cd "${BASE}"`,
    // nohup so it keeps running after request returns
    `nohup ./.agent-web/run_webagent.sh --repo "${BASE}" --model "${model}" --iters "${iters}" --timeout "${timeout}" --goals-file "${GOALS_FILE}" >> "${AGENT_DIR}/reports/${logName}" 2>&1 &`,
    // capture background PID
    `echo $! > "${PID_FILE}"`
  ].join(" && ");

  await sh(cmd);
}

async function stopAction() {
  "use server";
  const pid = await readpid();
  if (!pid) return;

  // Try a graceful TERM, then KILL after a short wait
  await sh(`kill -TERM ${pid} 2>/dev/null || true; sleep 1; kill -0 ${pid} 2>/dev/null && kill -KILL ${pid} 2>/dev/null || true; rm -f "${PID_FILE}" || true`);
}

async function publishToVM() {
  "use server";
  // Build and restart systemd unit (sudoers already configured)
  const cmd = [
    `cd "${BASE}"`,
    `which pnpm >/dev/null 2>&1 || source ~/.nvm/nvm.sh >/dev/null 2>&1`,
    `pnpm build`,
    `sudo /usr/bin/systemctl restart prestige-prep`
  ].join(" && ");
  await sh(cmd);
}

async function commitAndPush(formData: FormData) {
  "use server";
  const branch = String(formData.get("branch") || "");
  const msgRaw = String(formData.get("message") || "web-agent: patch ...");

  const branchName =
    branch || `agent-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;

  // Escape characters problematic in a double-quoted shell string.
  const safeMsg = msgRaw.replace(/(["`\\$])/g, "\\$1");

  const cmd = [
    `cd "${BASE}"`,
    `git checkout -B "${branchName}"`,
    `git add -A`,
    `git commit -m "${safeMsg}" || true`,
    `git push -u origin "${branchName}" --force`
  ].join(" && ");

  await sh(cmd);
}

// ====== PAGE UI ======

export default async function Page() {
  const pid = await readpid();
  const running = !!pid;
  const lastLog = await newestLogPath();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Web Agent (Next.js)</h1>

      <div className="rounded-xl border p-4 space-y-2">
        <div>PID: {running ? <span className="text-green-600 font-mono">{pid}</span> : <span className="text-gray-500">—</span>} {running ? "🟢 running" : "⚪ stopped"}</div>
        <div>Branch: <code>main</code></div>
      </div>

      <form action={startAction} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Start Web Agent</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm text-gray-600">Model</div>
            <input name="model" defaultValue="gemini-2.5-pro" className="w-full border rounded px-2 py-1" />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Iters</div>
            <input name="iters" defaultValue="25" className="w-full border rounded px-2 py-1" />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Timeout (s)</div>
            <input name="timeout" defaultValue="9000" className="w-full border rounded px-2 py-1" />
          </label>
        </div>
        <label className="block">
          <div className="text-sm text-gray-600">Goals</div>
          <textarea
            name="goals"
            defaultValue={defaultGoals}
            rows={10}
            className="w-full border rounded px-2 py-1 font-mono text-sm"
          />
        </label>
        <button className="rounded bg-black text-white px-3 py-1" type="submit">
          Start
        </button>
      </form>

      <form action={stopAction} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Stop</h2>
        <p className="text-sm text-gray-600">Send SIGTERM to the current PID (if any).</p>
        <button className="rounded bg-rose-600 text-white px-3 py-1" type="submit">
          Stop Agent
        </button>
      </form>

      <form action={publishToVM} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Publish latest changes to VM</h2>
        <p className="text-sm text-gray-600">
          Runs <code>pnpm build</code> then <code>systemctl restart prestige-prep</code>. Refresh your browser to see the update.
        </p>
        <button className="rounded bg-indigo-600 text-white px-3 py-1" type="submit">
          Publish to VM
        </button>
      </form>

      <form action={commitAndPush} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Commit &amp; Push (create/overwrite branch)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm text-gray-600">Branch</div>
            <input
              name="branch"
              placeholder="agent-YYYYMMDDHHMMSS"
              className="w-full border rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Commit message</div>
            <input
              name="message"
              defaultValue="web-agent: patch ..."
              className="w-full border rounded px-2 py-1"
            />
          </label>
        </div>
        <button className="rounded bg-emerald-600 text-white px-3 py-1" type="submit">
          Commit &amp; Push
        </button>
      </form>

      <div className="rounded-xl border p-4 space-y-2">
        <h2 className="font-semibold">Live Log (tail)</h2>
        <p className="text-sm text-gray-600">
          {lastLog ? <>Latest: <code className="break-all">{lastLog}</code></> : "No logs yet."}
        </p>
        {/* Client log viewer */}
        <LiveLog />
      </div>
    </div>
  );
}
