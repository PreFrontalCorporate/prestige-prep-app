// lib/gcs.ts
import { Storage } from "@google-cloud/storage";

const PROJECT_ID =
  process.env.GCP_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT;

const BUCKET = process.env.GCP_BUCKET;

if (!BUCKET) {
  console.warn("[gcs] GCP_BUCKET not set");
}

export const storage = new Storage({ projectId: PROJECT_ID });
export const bucket = BUCKET ? storage.bucket(BUCKET) : null;

export async function readTextFile(path: string): Promise<string> {
  if (!bucket) throw new Error("Bucket not configured (GCP_BUCKET missing)");
  const [buf] = await bucket.file(path).download();
  return buf.toString("utf8");
}
