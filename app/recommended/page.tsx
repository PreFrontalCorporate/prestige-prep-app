// app/recommended/page.tsx
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";

type WeakRow = { key: string; wrong: number; total: number; acc: number };

async function getWeakAreas(): Promise<WeakRow[] | null> {
  try {
    const sessionRefs = await db.collection("attempts").listDocuments();
    const take = sessionRefs.slice(0, 3);
    const buckets = new Map<string, { wrong: number; total: number }>();

    for (const ref of take) {
      const snap = await ref
        .collection("events")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      for (const d of snap.docs) {
        const e = d.data() || {};
        const tags: string[] = Array.isArray(e.tags) ? e.tags : [];
        const section = e.section || "Unknown";
        const key = [...tags, section].join(" / ") || "Unlabeled";

        const b = buckets.get(key) || { wrong: 0, total: 0 };
        b.total += 1;
        b.wrong += e.correctness === true ? 0 : 1;
        buckets.set(key, b);
      }
    }

    const arr: WeakRow[] = Array.from(buckets, ([key, v]) => ({
      key,
      wrong: v.wrong,
      total: v.total,
      acc: v.total ? 1 - v.wrong / v.total : 1,
    }))
      .filter((r) => r.total >= 3)
      .sort((a, b) => a.acc - b.acc || b.total - a.total)
      .slice(0, 8);

    return arr;
  } catch {
    return null;
  }
}

export default async function Page() {
  const rows = await getWeakAreas();

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Recommended</h1>

      {!rows && (
        <div className="rounded-md border bg-yellow-50 p-3 text-sm text-yellow-900">
          Couldn’t read attempts yet. Do a few items in <b>Drill Runner</b>,
          then come back.
        </div>
      )}

      {rows && rows.length === 0 && (
        <p>Not enough recent attempts yet. Solve a few items to unlock suggestions.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Area (tags / section)</th>
                <th className="px-3 py-2 text-right">Wrong</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-3 py-2">{r.key}</td>
                  <td className="px-3 py-2 text-right">{r.wrong}</td>
                  <td className="px-3 py-2 text-right">{r.total}</td>
                  <td className="px-3 py-2 text-right">
                    {(r.acc * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
