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
        exam: (data as any).exam,
        count: (data as any).count,
        path: (data as any).path,
        createdAt: (data as any).createdAt,
      };
    });
  } catch (e) {
    console.warn("[/api/contentSets] Firestore failed:", e);
    return [];
  }
}

async function listFromGCS(): Promise<SetMeta[]> {
  if (!bucket) return [];
  try {
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
        // best effort, leave meta empty
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
  } catch (e) {
    console.warn("[/api/contentSets] GCS listing failed:", e);
    return [];
  }
}

export async function GET() {
  try {
    // Try Firestore first
    const fsSets = await listFromFirestore();
    if (fsSets.length > 0) {
      return NextResponse.json({ sets: fsSets });
    }
    // Fallback to GCS listing
    const gcsSets = await listFromGCS();
    return NextResponse.json({ sets: gcsSets });
  } catch (err: any) {
    console.error("[/api/contentSets] fatal error:", err);
    return NextResponse.json(
      { sets: [], error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
