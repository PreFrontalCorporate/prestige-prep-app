// app/admin/content/page.tsx
import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

type SetMeta = {
  id: string;
  exam?: string;
  count?: number;
  path?: string;
  createdAt?: string | number;
};

async function loadSets(): Promise<{
  sets: SetMeta[];
  error?: string;
  diag?: any;
}> {
  const base = getBaseUrl();
  try {
    const r = await fetch(`${base}/api/contentSets`, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return { sets: j.sets ?? [] };
  } catch (e: any) {
    // Try diag to surface misconfig
    let diag: any = null;
    try {
      const d = await fetch(`${base}/api/diag`, { cache: "no-store" });
      if (d.ok) diag = await d.json();
    } catch {}
    return { sets: [], error: String(e?.message || e), diag };
  }
}

export default async function Page() {
  const { sets, error, diag } = await loadSets();

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Content Admin</h1>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <div className="font-medium">Failed to load sets.</div>
          <div className="mt-1">Error: {error}</div>
          {diag && (
            <details className="mt-3">
              <summary className="cursor-pointer">Show diagnostics</summary>
              <pre className="mt-2 overflow-auto rounded bg-white/70 p-2 text-xs">
                {JSON.stringify(diag, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {!error && sets.length === 0 && <p>No sets found.</p>}

      {sets.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Set</th>
                <th className="px-3 py-2 text-left">GCS Path</th>
                <th className="px-3 py-2 text-right">Count</th>
                <th className="px-3 py-2 text-left">Exam</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sets.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.id}</td>
                  <td className="px-3 py-2">{s.path || "—"}</td>
                  <td className="px-3 py-2 text-right">{s.count ?? "—"}</td>
                  <td className="px-3 py-2">{s.exam || "—"}</td>
                  <td className="px-3 py-2">
                    <form action="/api/loadSet" method="post">
                      <input type="hidden" name="set" value={s.id} />
                      <button className="rounded-md bg-blue-600 px-3 py-1.5 text-white shadow-sm hover:bg-blue-700">
                        Import
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-2">
        <Link href="/drills" className="text-blue-600 hover:underline">
          Go to Drills →
        </Link>
      </div>
    </div>
  );
}
