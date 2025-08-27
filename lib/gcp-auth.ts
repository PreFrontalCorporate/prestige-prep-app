// lib/gcp-auth.ts
import fs from "node:fs";

// If Vercel provides raw SA JSON, write it to /tmp and point ADC at it.
const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (raw) {
  try {
    const target = "/tmp/gcp-sa.json";
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      fs.writeFileSync(target, raw, "utf8");
      process.env.GOOGLE_APPLICATION_CREDENTIALS = target;
    }
  } catch (err) {
    console.error("[gcp-auth] Failed writing credentials:", err);
  }
}

// Normalize project id for Google SDKs if missing
if (!process.env.GOOGLE_CLOUD_PROJECT) {
  const proj =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;
  if (proj) process.env.GOOGLE_CLOUD_PROJECT = proj;
}
