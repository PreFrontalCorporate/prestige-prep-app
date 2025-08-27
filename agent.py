#!/usr/bin/env python3
import google.generativeai as genai
import subprocess, datetime, sys, os, re, textwrap
from pathlib import Path
from dotenv import load_dotenv

CONTEXT_IGNORE={".git",".venv","node_modules","__pycache__", ".agent"}
STATE=Path(".agent"); REPORTS=STATE/"reports"; LOCK=STATE/"run.lock"
STATE.mkdir(exist_ok=True, parents=True); REPORTS.mkdir(exist_ok=True, parents=True)
if LOCK.exists(): print("🛑 Lock exists."); sys.exit(1)
LOCK.touch()
log_path = REPORTS / f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
log_file = open(log_path,"w",encoding="utf-8")
def log(m): print(f"[AGENT] {m}", flush=True); log_file.write(m+"\n"); log_file.flush()

def run(cmd, check=True):
  log("🏃 "+" ".join(cmd))
  try:
    r = subprocess.run(cmd, capture_output=True, text=True, check=check)
    log("   | stdout: "+r.stdout.strip()); log("   | stderr: "+r.stderr.strip())
    if check and r.returncode!=0: return False, r.stderr.strip()
    return True, r.stdout.strip()
  except Exception as e: return False, str(e)

def context():
  ok, files = run(["git","ls-files"], check=False)
  file_list = files.splitlines() if ok else [str(p) for p in Path().rglob("*") if p.is_file() and not any(x in p.parts for x in CONTEXT_IGNORE)]
  blocks=[]
  for f in file_list:
    try: blocks.append(f"----\n📄 {f}\n----\n"+Path(f).read_text(encoding="utf-8",errors="ignore"))
    except Exception as e: blocks.append(f"----\n📄 {f}\n----\n(could not read: {e})")
  return "\n".join(blocks)

def gate():
  for c in [["pnpm","install"],["pnpm","typecheck"],["pnpm","test"],["pnpm","e2e:ci"],["pnpm","build"]]:
    ok,_ = run(c); 
    if not ok: return False
  return True

def parse(text):
  msum = re.search(r"## Summary of Changes\n(.*?)$", text, re.DOTALL)
  edits = re.findall(r"EDIT ([\w/\.\-]+)\n```[\w]*\n(.*?)\n```", text, re.DOTALL)
  if not msum or not msum.group(1).strip(): return {"error":"missing summary"}
  if not edits: return {"error":"missing EDIT blocks"}
  return {"summary": msum.group(1).strip(), "edits": edits}

def apply(edits):
  for fp,content in edits:
    p=Path(fp); p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists(): p.unlink()
    p.write_text(content, encoding="utf-8"); log(f"   | wrote {p} ({len(content)} chars)")
  return True

def main():
  envp=Path(".agent/agent.env"); 
  if envp.exists(): load_dotenv(envp)
  api=os.getenv("GOOGLE_API_KEY"); 
  if not api: log("❌ GOOGLE_API_KEY missing"); sys.exit(1)
  genai.configure(api_key=api)
  MAX_PASSES=int(os.getenv("MAX_PASSES","10"))
  task=sys.argv[1] if len(sys.argv)>1 else "scaffold-app"
  mem=""
  for i in range(1, MAX_PASSES+1):
    log(f"--- 🔁 Pass {i}/{MAX_PASSES} task={task} ---")
    prompt=textwrap.dedent(f"""
    You are an elite Next.js engineer. Edit files using EDIT blocks and include ## Plan and ## Summary of Changes.
    Ensure: pnpm install/typecheck/test/e2e:ci/build succeed.

    ## Task
    {task}

    ## Memory
    {mem}

    ## Repo Context
    {context()}
    """).strip()
    try:
      r=genai.GenerativeModel("gemini-1.5-pro-latest").generate_content(prompt)
      text=r.text if hasattr(r,"text") else ""
    except Exception as e:
      mem=f"Model call failed: {e}"; continue

    parsed=parse(text)
    if "error" in parsed: mem=f"Invalid response: {parsed['error']}"; continue
    apply(parsed["edits"])
    if gate():
      run(["git","add","-A"],check=False)
      run(["git","commit","-m",f"agent: {task} pass {i}"],check=False)
      tag=f"app-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
      run(["git","tag",tag],check=False)
      run(["git","push","origin","HEAD","--tags"],check=False)
      log("🎉 Success"); break
    else:
      run(["git","reset","--hard","HEAD"],check=False)
      mem="Gate failed; analyze stderr and try another approach."
  Path(LOCK).unlink()

if __name__=="__main__": main()
