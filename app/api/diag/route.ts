// app/api/diag/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { bucket } from "@/lib/gcs";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: any = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT,
  };

  // Firestore probe
  try {
    const snap = await db.collection("contentSets").limit(10).get();
    out.firestore = {
      ok: true,
      count: snap.size,
      ids: snap.docs.map((d) => d.id),
    };
  } catch (e: any) {
    out.firestore = { ok: false, error: String(e?.message || e) };
  }

  // GCS probe
  try {
    if (!bucket) throw new Error("Bucket not configured (GCP_BUCKET missing?)");
    const [files] = await bucket.getFiles({
      prefix: "content/sets/",
      maxResults: 200,
    });
    const setIds = Array.from(
      new Set(
        files
          .map((f) => f.name.match(/^content\/sets\/([^/]+)\//)?.[1])
          .filter(Boolean) as string[]
      )
    );
    out.gcs = {
      ok: true,
      bucket: bucket.name,
      fileCount: files.length,
      setIds,
    };
  } catch (e: any) {
    out.gcs = {
      ok: false,
      bucket: process.env.GCP_BUCKET,
      error: String(e?.message || e),
    };
  }

  return NextResponse.json(out);
}
