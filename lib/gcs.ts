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
    if (rawJson && rawJson.trim().startsWith("{")) {
      return JSON.parse(rawJson);
    }
    if (rawB64 && rawB64.trim().length > 0) {
      const json = Buffer.from(rawB64, "base64").toString("utf8");
      return JSON.parse(json);
    }
  } catch {}
  return null;
}

const sa = getServiceAccount();

// Accept projectId from SA json or common env names
const projectId =
  sa?.project_id ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCS_PROJECT;

const bucketName = process.env.GCS_BUCKET;
if (!bucketName) {
  throw new Error("GCS_BUCKET env is required");
}

// CRITICAL: normalize \n in private_key when coming from env
const pk = (sa?.private_key || "").replace(/\\n/g, "\n");

export const storage = new Storage(
  sa
    ? {
        projectId,
        credentials: {
          client_email: sa.client_email,
          private_key: pk,
        },
      }
    : projectId
    ? { projectId }
    : {}
);

export const bucket = storage.bucket(bucketName);

export async function readTextFile(path: string): Promise<string> {
  const [buf] = await bucket.file(path).download();
  return buf.toString("utf8");
}

// List all 'sets/*/index.json' (name + path)
export async function listIndexJsonUnderSets(): Promise<
  { name: string; path: string }[]
> {
  const [files] = await bucket.getFiles({ prefix: "sets/" });
  const indices = files.filter((f) => f.name.endsWith("/index.json"));
  return indices.map((f) => {
    const parts = f.name.split("/"); // sets/<set>/index.json
    const setName = parts.length >= 3 ? parts[1] : "";
    return { name: setName, path: f.name };
  });
}
