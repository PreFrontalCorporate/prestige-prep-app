// lib/gcs.ts
import "server-only";
import { Storage } from "@google-cloud/storage";

type SA = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function getServiceAccount(): SA | null {
  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const rawB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  try {
    if (rawJson && rawJson.trim().startsWith("{")) return JSON.parse(rawJson);
    if (rawB64 && rawB64.trim().length > 0) {
      const json = Buffer.from(rawB64, "base64").toString("utf8");
      return JSON.parse(json);
    }
  } catch {}
  return null;
}

const sa = getServiceAccount();

const projectId =
  sa?.project_id ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCS_PROJECT;

const bucketName = process.env.GCS_BUCKET;
if (!bucketName) throw new Error("GCS_BUCKET env is required");

export const storage = new Storage(
  sa
    ? {
        projectId,
        credentials: {
          client_email: sa.client_email,
          private_key: sa.private_key,
        },
      }
    : { projectId }
);

export const bucket = storage.bucket(bucketName);

export async function readText(path: string): Promise<string> {
  const [buf] = await bucket.file(path).download();
  return buf.toString("utf8");
}

export async function readJson<T = any>(path: string): Promise<T> {
  const txt = await readText(path);
  return JSON.parse(txt) as T;
}

export async function writeJson(path: string, data: any): Promise<void> {
  const file = bucket.file(path);
  const body = JSON.stringify(data);
  await file.save(body, {
    contentType: "application/json",
    resumable: false,
    validation: "crc32c",
    metadata: { cacheControl: "no-cache" },
  });
}

export async function exists(path: string): Promise<boolean> {
  const [ok] = await bucket.file(path).exists();
  return !!ok;
}

export async function copyObject(src: string, dest: string): Promise<void> {
  await bucket.file(src).copy(bucket.file(dest));
}

export async function listPaths(prefix: string, suffix?: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
  return files
    .map((f) => f.name)
    .filter((p) => (!suffix ? true : p.endsWith(suffix)));
}
