// lib/gcs.ts
// Server-only GCS handle. Bucket name comes from env (optional for now).

import 'server-only';
import { Storage } from '@google-cloud/storage';

const storage = new Storage(); // ADC on the VM
export const gcs = storage;
export function getBucket(bucketEnv = process.env.GCS_BUCKET) {
  if (!bucketEnv) {
    // You can pass the bucket name explicitly in callers if env not set.
    throw new Error('GCS_BUCKET env var is not set');
  }
  return storage.bucket(bucketEnv);
}
