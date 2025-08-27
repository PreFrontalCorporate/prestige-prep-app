// lib/gcp-auth.ts
// Robustly provision GOOGLE_APPLICATION_CREDENTIALS at runtime.
// Supports either:
//  - GOOGLE_APPLICATION_CREDENTIALS_JSON_B64 (base64 of the whole JSON)
//  - GOOGLE_APPLICATION_CREDENTIALS_JSON (raw JSON string)
// Falls back to existing GOOGLE_APPLICATION_CREDENTIALS or ADC on GCE.

import fs from "fs";
import os from "os";
import path from "path";

const TARGET =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(os.tmpdir(), "gcp-sa.json");

function provisionFromEnv(): "b64" | "json" | null {
  try {
    const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_B64?.trim();
    if (b64) {
      const json = Buffer.from(b64, "base64").toString("utf8");
      fs.writeFileSync(TARGET, json, { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = TARGET;
      return "b64";
    }

    const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (raw && raw.trim().length > 0) {
      // Write as-is (don’t JSON.parse to avoid “control character” issues).
      fs.writeFileSync(TARGET, raw.trim(), { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = TARGET;
      return "json";
    }
  } catch (e) {
    console.error("[gcp-auth] Failed writing SA JSON:", e);
  }
  return null;
}

const source = provisionFromEnv();
if (!source) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      "[gcp-auth] No credentials JSON provided; relying on default ADC (GCE/Cloud Run) or existing key on disk."
    );
  }
}
