#!/usr/bin/env python3
import argparse, os, subprocess, tempfile, re
from pathlib import Path

MAX_TOKENS = 4096

def run(cmd, cwd=None, timeout=900):
    p = subprocess.Popen(cmd, cwd=cwd, shell=True,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        out, _ = p.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        p.kill()
        out = f"[TIMEOUT after {timeout}s] {cmd}"
    return p.returncode, out

def tail_text(s: str, max_chars=14000):
    return s[-max_chars:] if len(s) > max_chars else s

def extract_unidiff(text: str) -> str:
    m = re.search(r"```(?:diff|unidiff)\s+([\s\S]*?)```", text, re.M|re.I)
    if m:
        return m.group(1).strip()
    start = None
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("diff --git ") or line.startswith("--- ") or line.startswith("Index: "):
            start = i
            break
    if start is not None:
        return "\n".join(lines[start:]).strip()
    return ""

def apply_patch(repo: Path, patch_text: str) -> tuple[bool, str]:
    if not patch_text.strip():
        return False, "empty patch"
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".diff") as f:
        f.write(patch_text)
        patch_path = f.name
    try:
        rc, out = run(f'git apply --whitespace=fix --index "{patch_path}"', cwd=str(repo))
        if rc != 0:
            rc2, out2 = run(f'git apply -p0 --whitespace=fix --index "{patch_path}"', cwd=str(repo))
            if rc2 != 0:
                return False, tail_text(out + "\n----\n" + out2, 12000)
        return True, "applied"
    finally:
        try: os.remove(patch_path)
        except: pass

def ensure_env():
    if not os.getenv("GOOGLE_API_KEY"):
        print("[WEBAGENT] ERROR: GOOGLE_API_KEY not set in environment.")
        raise SystemExit(2)

def call_model(model_name: str, prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(
        prompt,
        generation_config={"temperature": 0.2, "max_output_tokens": MAX_TOKENS},
    )
    return resp.text or ""

def repo_snapshot(repo: Path) -> str:
    important = [
        # configs
        "package.json", "pnpm-lock.yaml", "tsconfig.json",
        "next.config.mjs", "next.config.js",
        "tailwind.config.js", "postcss.config.js",
        # libs & api used today
        "lib/firestore.ts", "lib/gcs.ts",
        "app/api/contentSets/route.ts", "app/api/loadSet/route.ts",
        "app/api/currentSet/route.ts", "app/api/items/route.ts",
        # current pages for context
        "app/layout.tsx", "app/page.tsx",
        "app/drills/page.tsx",
        "app/admin/content/page.tsx", "app/admin/agent/page.tsx", "app/admin/web/page.tsx"
    ]
    pieces = []
    for rel in important:
        p = repo / rel
        if p.exists() and p.is_file():
            try:
                txt = p.read_text(encoding="utf-8", errors="ignore")
                pieces.append(f"\n# FILE: {rel}\n{txt[:6000]}")
            except Exception as e:
                pieces.append(f"\n# FILE: {rel}\n<error reading: {e}>")
    return "\n".join(pieces)

SYSTEM_RULES = """You are a code-modification agent for a Next.js 14 + TypeScript app in a git repo.
Your task each iteration:
1) Read GOALS and latest build output.
2) Propose a SMALL, SAFE unified diff that moves toward success (fixing the top failing build step or implementing one bite-sized feature).
3) Output ONLY a single fenced code block with unified diff (```diff ... ```). No prose.

Constraints:
- Use minimal, incremental patches. No big rewrites. Keep existing features working.
- Prefer Server Actions over public API endpoints when possible.
- Keep TypeScript strict and imports correct. Update configs minimally if required.
- If adding packages (e.g., katex, remark-math, rehype-katex, react-markdown), change package.json and any needed code. Avoid heavy deps.
- For tracking attempts, use anonymous cookie sessionId + Firestore via existing lib/firestore.ts patterns.
- For recommendations, aggregate wrong answers by section/tag & difficulty over recent attempts.
- Add /methods, /methods/[slug], and /recommended pages progressively. Add a lightweight quick content picker to /drills.
- Ensure `pnpm build` passes after your change when possible.
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--model", default="gemini-2.5-pro")
    ap.add_argument("--iters", type=int, default=7)
    ap.add_argument("--timeout", type=int, default=900)
    ap.add_argument("--goals", default="Add KaTeX; methodologies pages; tracking; recommendations; build green.")
    args = ap.parse_args()

    ensure_env()
    repo = Path(args.repo).resolve()
    os.chdir(repo)

    # Baseline build
    rc, out = run("pnpm build", cwd=str(repo), timeout=args.timeout)
    print("[WEBAGENT] Baseline build rc:", rc)
    print(tail_text(out))

    for i in range(1, args.iters + 1):
        if rc == 0:
            print(f"[WEBAGENT] Build succeeded on iteration {i-1}. Stopping.")
            break

        snap = repo_snapshot(repo)
        prompt = f"""{SYSTEM_RULES}

GOALS:
{args.goals}

LATEST BUILD (tail):
{tail_text(out, 12000)}

REPO SNAPSHOT (selected files):
{snap}

Return ONLY a single unified diff in one code fence. Keep the patch as small as possible while addressing the most immediate issue or a clearly-scoped step toward the goals.
"""
        print(f"[WEBAGENT] Iteration {i}: querying model…")
        try:
            raw = call_model(args.model, prompt)
        except Exception as e:
            print(f"[WEBAGENT] Model error: {e}")
            break

        diff = extract_unidiff(raw)
        if not diff:
            print("[WEBAGENT] No diff extracted; stopping.")
            break

        ok, msg = apply_patch(repo, diff)
        print(f"[WEBAGENT] apply_patch: {ok} ({msg})")
        if not ok:
            print("[WEBAGENT] Patch failed to apply. Stopping.\n--- DIFF START ---\n" + diff[:6000] + "\n--- DIFF END ---")
            break

        # Commit, rebuild
        run('git add -A', cwd=str(repo))
        run(f'git commit -m "webagent: iteration {i}"', cwd=str(repo))

        rc, out = run("pnpm build", cwd=str(repo), timeout=args.timeout)
        print(f"[WEBAGENT] Build rc after iteration {i}:", rc)
        print(tail_text(out))

    status = "SUCCESS" if rc == 0 else "FAILED"
    print(f"[WEBAGENT] DONE: {status}")

if __name__ == "__main__":
    main()
