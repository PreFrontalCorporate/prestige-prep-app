// app/api/diag/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';
import { db } from '@/lib/firestore';

export async function GET() {
  const envReport = {
    // do not print secrets; just lengths/booleans
    GOOGLE_APPLICATION_CREDENTIALS_JSON_len:
      (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '').length,
    GOOGLE_APPLICATION_CREDENTIALS_BASE64_len:
      (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || '').length,
    GOOGLE_CLOUD_PROJECT:
      process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null,
    GCS_PROJECT: process.env.GCS_PROJECT || null,
    GCS_BUCKET: process.env.GCS_BUCKET || null,
  };

  const out: any = {
    env: envReport,
    projectId:
      envReport.GOOGLE_CLOUD_PROJECT ||
      envReport.GCS_PROJECT ||
      'undefined',
  };

  // GCS check
  try {
    const [meta] = await bucket.getMetadata();
    out.gcs = { ok: true, bucket: meta.name, location: meta.location };
  } catch (e: any) {
    out.gcs = { ok: false, error: String(e?.message || e) };
  }

  // Firestore check
  try {
    // lightweight permission check
    await db.listCollections();
    out.firestore = { ok: true };
  } catch (e: any) {
    out.firestore = { ok: false, error: String(e?.message || e) };
  }

  return NextResponse.json(out);
}
