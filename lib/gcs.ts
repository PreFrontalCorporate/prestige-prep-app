// lib/gcs.ts
import "server-only";
import { Storage } from "@google-cloud/storage";

type SA = { client_email: string; private_key: string; project_id?: string };

function getServiceAccount(): SA | null {
  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const rawB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  try {
    if (rawJson && rawJson.trim().startsWith("{")) return JSON.parse(rawJson);
    if (rawB64 && rawB64.trim()) {
      const json = Buffer.from(rawB64, "base64").toString("utf8");
      return JSON.parse(json);
    }
  } catch {}
  return null;
}

const sa = getServiceAccount();
const projectId =
  sa?.project_id ||
  process.env.GCS_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;

if (!process.env.GCS_BUCKET) {
  throw new Error("GCS_BUCKET env is required");
}

const credentials = sa
  ? {
      client_email: sa.client_email,
      private_key: (sa.private_key || "").replace(/\\n/g, "\n"),
    }
  : undefined;

export const storage = new Storage(
  credentials ? { projectId, credentials } : { projectId }
);

export const bucket = storage.bucket(process.env.GCS_BUCKET);

/** Read whole file as utf8 text */
export async function readTextFile(path: string): Promise<string> {
  const [buf] = await bucket.file(path).download();
  return buf.toString("utf8");
}

/** Save JSON (one shot, no resumable) */
export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  const file = bucket.file(path);
  await file.save(JSON.stringify(data), {
    contentType: "application/json",
    resumable: false,
    validation: "crc32c",
  });
}

/** Copy an object inside the same bucket */
export async function copyObject(srcPath: string, destPath: string): Promise<void> {
  await bucket.file(srcPath).copy(bucket.file(destPath));
}

/** Does a path exist? */
export async function exists(path: string): Promise<boolean> {
  const [ok] = await bucket.file(path).exists();
  return ok;
}

/** List <sets/*>/index.json for Content Admin */
export async function listIndexJsonUnderSets(): Promise<{ name: string; path: string }[]> {
  const [files] = await bucket.getFiles({ prefix: "sets/", autoPaginate: false });
  return files
    .filter((f) => f.name.endsWith("index.json") && f.name.split("/").length === 3)
    .map((f) => ({ name: f.name.split("/")[1]!, path: f.name }));
}
