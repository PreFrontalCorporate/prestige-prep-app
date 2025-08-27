// app/api/contentSets/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { bucket, readTextFile } from "@/lib/gcs";

export const dynamic = "force-dynamic";

type SetMeta = {
  id: string;
  exam?: string;
  count?: number;
  path?: string;
  createdAt?: string | number;
};

async function listFromFirestore(): Promise<SetMeta[]> {
  try {
    const snap = await db.collection("contentSets").get();
    if (snap.empty) return [];
    return snap.docs.map((d) => {
      const data = d.data() ?? {};
      return {
        id: d.id,
        exam: data.exam,
        count: data.count,
        path: data.path,
        createdAt: data.createdAt,
      };
    });
  } catch (e) {
    console.warn("[contentSets] Firestore failed:", e);
    return [];
  }
}

async function listFromGCS(): Promise<SetMeta[]> {
  if (!bucket) return [];
  const prefix = "content/sets/";
  const [files] = await bucket.getFiles({ prefix });

  // derive set ids from file paths like content/sets/<setId>/...
  const ids = new Set<string>();
  for (const f of files) {
    const m = f.name.match(/^content\/sets\/([^/]+)\//);
    if (m) ids.add(m[1]);
  }

  const metas: SetMeta[] = [];
  for (const id of ids) {
    let meta: Partial<SetMeta> = {};
    try {
      const text = await readTextFile(`content/sets/${id}/metadata.json`);
      meta = JSON.parse(text);
    } catch {
      // best effort
    }
    metas.push({
      id,
      exam: (meta as any)?.exam,
      count: (meta as any)?.count,
      path: `gs://${process.env.GCP_BUCKET}/content/sets/${id}/`,
    });
  }
  // sort newest-ish first by id if timestamped
  metas.sort((a, b) => (a.id > b.id ? -1 : 1));
  return metas;
}

export async function GET() {
  // Try Firestore first
  const fsSets = await listFromFirestore();
  if (fsSets.length > 0) {
    return NextResponse.json({ sets: fsSets });
  }
  // Fallback to GCS listing
  const gcsSets = await listFromGCS();
  return NextResponse.json({ sets: gcsSets });
}
