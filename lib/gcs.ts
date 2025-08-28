// lib/gcs.ts
// Server-only helpers for Google Cloud Storage (GCS).
// Works with ADC on your VM (no key file needed). On Vercel, set env vars.

// Ensure this never bundles into the client.
import 'server-only';

import type { Bucket } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';

/**
 * Under the hood we use a single Storage instance.
 * On GCE/Cloud Run this uses ADC automatically.
 */
export const gcs = new Storage();

/**
 * Resolve the bucket name from env. We support a few names to be flexible.
 * Set one of these on VM (.env.local) and in Vercel Project Settings:
 *   - GCS_BUCKET   (preferred)
 *   - GCLOUD_STORAGE_BUCKET
 *   - GOOGLE_CLOUD_STORAGE_BUCKET
 */
function resolveBucketName(): string | undefined {
  return (
    process.env.GCS_BUCKET ||
    process.env.GCLOUD_STORAGE_BUCKET ||
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  );
}

/**
 * Export a top-level Bucket reference for existing imports:
 *   import { bucket } from '@/lib/gcs'
 *
 * If no env is configured, this stays null; callers can either
 * (1) pass a bucketName to readTextFile, or
 * (2) rely on requireBucket() which will throw a clear error.
 */
export const bucket: Bucket | null = (() => {
  const name = resolveBucketName();
  return name ? gcs.bucket(name) : null;
})();

/** Throws with a helpful message if no bucket name is configured. */
function requireBucket(): Bucket {
  if (bucket) return bucket;
  const name = resolveBucketName();
  if (!name) {
    throw new Error(
      'GCS bucket not configured. Set GCS_BUCKET in .env.local (VM) and Vercel → Project Settings → Environment Variables.'
    );
  }
  return gcs.bucket(name);
}

/**
 * Read a text file from GCS.
 * - path: object path within the bucket (e.g. "sets/sat-smoke/meta.json")
 * - opts.bucketName: override bucket if needed
 * - opts.encoding: defaults to "utf8"
 */
export async function readTextFile(
  path: string,
  opts?: { bucketName?: string; encoding?: BufferEncoding }
): Promise<string> {
  const encoding = opts?.encoding ?? 'utf8';
  const b = opts?.bucketName ? gcs.bucket(opts.bucketName) : requireBucket();
  const [buf] = await b.file(path).download();
  return buf.toString(encoding);
}

/** Optional convenience if you need it elsewhere later. */
export async function readJson<T = unknown>(
  path: string,
  opts?: { bucketName?: string }
): Promise<T> {
  const txt = await readTextFile(path, { bucketName: opts?.bucketName });
  return JSON.parse(txt) as T;
}
