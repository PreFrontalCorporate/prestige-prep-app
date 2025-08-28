// app/api/diag/route.ts
import { NextResponse } from "next/server";
import { bucket, listIndexJsonUnderSets } from "@/lib/gcs";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    GOOGLE_APPLICATION_CREDENTIALS_JSON_len:
      (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "").length,
    GOOGLE_APPLICATION_CREDENTIALS_BASE64_len:
      (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || "").length,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || null,
    GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || null,
    GCS_PROJECT: process.env.GCS_PROJECT || null,
    GCS_BUCKET: process.env.GCS_BUCKET || null,
  };

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCS_PROJECT ||
    null;

  const gcs: any = { ok: false, bucket: env.GCS_BUCKET, samplePaths: [] as string[] };
  try {
    const list = await listIndexJsonUnderSets();
    gcs.ok = true;
    gcs.samplePaths = list.slice(0, 10).map((x) => x.path);
  } catch (e: any) {
    gcs.error = String(e?.message || e);
  }

  const firestore: any = { ok: false };
  try {
    // lightweight ping
    await db.listCollections();
    firestore.ok = true;
  } catch (e: any) {
    firestore.error = String(e?.message || e);
  }

  return NextResponse.json({ env, projectId, gcs, firestore });
}
