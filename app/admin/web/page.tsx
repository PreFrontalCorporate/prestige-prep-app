import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
export const dynamic = "force-dynamic"; // always read fresh PID/logs

async function readPid(): Promise<string | null> {
  const p = path.join(process.cwd(), ".agent-web", "run.pid");
  try { return (await fs.readFile(p, "utf8")).trim(); } catch { return null; }
}

async function tailLog(n = 80): Promise<string> {
  const reportsDir = path.join(process.cwd(), ".agent-web", "reports");
  try {
    const files = (await fs.readdir(reportsDir))
      .filter(f => f.startsWith("webagent-") && f.endsWith(".log"))
      .sort().reverse();
    if (!files.length) return "No logs yet.";
    const latest = path.join(reportsDir, files[0]);
    const content = await fs.readFile(latest, "utf8");
    const lines = content.trim().split("\n");
    return lines.slice(-n).join("\n");
  } catch { return "No logs yet."; }
}

async function currentBranch(): Promise<string> {
  try {
    const { stdout } = await execFileP("bash", ["-lc", "git rev-parse --abbrev-ref HEAD"], { cwd: process.cwd() });
    return stdout.trim();
  } catch { return "unknown"; }
}

async function runJson(): Promise<any | null> {
  try {
    const p = path.join(process.cwd(), ".agent-web", "run.json");
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch { return null; }
}

/* ---------- SERVER ACTIONS ---------- */

async function startAction(formData: FormData) {
  "use server";
  const model = (formData.get("model") as string) || "gemini-2.5-pro";
  const iters = Number(formData.get("iters") || 25);
  const timeout = Number(formData.get("timeout") || 9000);
  const goals = (formData.get("goals") as string) || "";

  const agentDir = path.join(process.cwd(), ".agent-web");
  await fs.mkdir(agentDir, { recursive: true });
  const goalsPath = path.join(agentDir, "goals.txt");
  await fs.writeFile(goalsPath, goals, "utf8");

  const cmd = `
    MODEL='${model.replace(/'/g, "'\\''")}' \
    ITERS='${iters}' \
    TIMEOUT_SECS='${timeout}' \
    GOALS_FILE='${goalsPath.replace(/'/g, "'\\''")}' \
    APP_DIR='${process.cwd().replace(/'/g, "'\\''")}' \
    bash .agent-web/run_webagent.sh
  `;
  await execFileP("bash", ["-lc", cmd], { cwd: process.cwd() });
}

async function stopAction() {
  "use server";
  const pid = await readPid();
  if (!pid) return;
  await execFileP("bash", ["-lc", `kill -TERM ${pid} || true`], { cwd: process.cwd() });
}

async function publishAction() {
  "use server";
  // Build, then restart the service so your VM shows the latest changes
  await execFileP("bash", ["-lc", "pnpm build"], { cwd: process.cwd() });
  await execFileP("bash", ["-lc", "sudo /usr/bin/systemctl restart prestige-prep"]);
}

async function pushAction(formData: FormData) {
  "use server";
  const branch = (formData.get("branch") as string)
    || `agent-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0,14)}`;
  const msg = (formData.get("message") as string)
    || `web-agent: patch ${new Date().toISOString()}`;

  const cmd = [
    `git add -A`,
    // commit may no-op if nothing changed; don't fail build step
    `git commit -m ${JSON.stringify(msg)} || true`,
    `git push -u origin ${JSON.stringify(branch)}`
  ].join(" && ");

  await execFileP("bash", ["-lc", `git checkout -B ${JSON.stringify(branch)} && ${cmd}`], { cwd: process.cwd() });
}

/* ---------- PAGE ---------- */

export default async function Page() {
  const pid = await readPid();
  const logTail = await tailLog(80);
  const br = await currentBranch();
  const rj = await runJson();

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
- Small diffs only; keep existing features stable. Use server actions over public API. Keep TypeScript strict. Ensure \`pnpm build\` stays green.`;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Web Agent (Next.js)</h1>
      <div className="text-sm text-gray-600">
        <div>PID: {pid ?? "—"} {pid ? "🟢 running" : "⚪ stopped"}</div>
        <div>Branch: {br}</div>
        {rj && (
          <div className="mt-1">
            <div>Model: {rj.model} Iterations: {rj.iters}</div>
            <div>Started: {rj.startedAt}</div>
            <div>Repo: {rj.repo}</div>
          </div>
        )}
      </div>

      {/* Start/Stop agent */}
      <form action={startAction} className="space-y-3 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-medium">Start Web Agent</h2>

        <label className="block">
          <span className="text-sm font-medium">Model</span>
          <input name="model" defaultValue="gemini-2.5-pro" className="mt-1 w-full border rounded p-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Iters</span>
            <input name="iters" type="number" min={1} defaultValue={25} className="mt-1 w-full border rounded p-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Timeout (s)</span>
            <input name="timeout" type="number" min={0} defaultValue={9000} className="mt-1 w-full border rounded p-2" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Goals</span>
          <textarea name="goals" rows={16} defaultValue={defaultGoals}
            className="mt-1 w-full border rounded p-2 font-mono text-sm" />
        </label>

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">Start</button>
          <form action={stopAction}>
            <button formAction={stopAction} className="px-4 py-2 rounded bg-red-600 text-white">Stop</button>
          </form>
        </div>
      </form>

      {/* Publish to VM */}
      <form action={publishAction} className="space-y-2 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-medium">Publish latest changes to VM</h2>
        <p className="text-sm text-gray-600">
          Runs <code>pnpm build</code> and then <code>systemctl restart prestige-prep</code>. After this, a normal browser refresh will show the updated app on your VM.
        </p>
        <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">Publish to VM</button>
      </form>

      {/* Commit & Push for Vercel previews */}
      <form action={pushAction} className="space-y-2 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-medium">Commit & Push (create/overwrite branch)</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Branch</span>
            <input name="branch" placeholder="agent-YYYYMMDDHHMMSS" className="mt-1 w-full border rounded p-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Commit message</span>
            <input name="message" placeholder="web-agent: patch ..." className="mt-1 w-full border rounded p-2" />
          </label>
        </div>
        <p className="text-sm text-gray-600">
          Push to GitHub to trigger a Vercel preview (after you connect the repo on Vercel).
        </p>
        <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Commit & Push</button>
      </form>

      <div className="space-y-2">
        <h3 className="font-medium">Web Agent Log (tail)</h3>
        <pre className="p-3 bg-gray-900 text-gray-100 rounded overflow-auto text-xs leading-5 max-h-[50vh]">
{await tailLog(80)}
        </pre>
      </div>
    </main>
  );
}
