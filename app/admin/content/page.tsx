"use client";

import { useEffect, useState } from "react";

type SetMeta = {
  id: string;
  exam?: string;
  count?: number;
  path?: string;
  createdAt?: string | number;
};

export default function ContentAdmin() {
  const [sets, setSets] = useState<SetMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function loadSets() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/contentSets", { cache: "no-store" });
      const json = await res.json();
      const data: SetMeta[] = json?.sets || [];
      setSets(data);
    } catch (e: any) {
      setStatus(`Failed to load sets: ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSets();
  }, []);

  async function importSet(id: string) {
    setStatus(`Importing ${id}…`);
    try {
      const res = await fetch(`/api/loadSet?set=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      let imported = Number(json?.count ?? 0);

      // Fallback: ask items API for authoritative count if needed
      if (!imported) {
        const r2 = await fetch(
          `/api/items?set=${encodeURIComponent(id)}&limit=0`,
          { cache: "no-store" }
        );
        const j2 = await r2.json();
        if (typeof j2?.count === "number") imported = j2.count;
      }

      setStatus(
        `Imported ${imported} item${imported === 1 ? "" : "s"} from ${id}.`
      );
    } catch (e: any) {
      setStatus(`Import failed: ${String(e?.message || e)}`);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Content Admin</h1>

      {status && (
        <div className="mb-4 rounded border p-3 bg-gray-50 text-sm">{status}</div>
      )}

      <div className="mb-3 text-sm text-gray-600">
        {loading ? "Loading…" : sets.length === 0 ? "No sets found." : null}
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2 border-r">Set</th>
            <th className="text-left p-2 border-r">GCS Path</th>
            <th className="text-left p-2 border-r">Count</th>
            <th className="text-left p-2 border-r">Exam</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2 border-r">{s.id}</td>
              <td className="p-2 border-r">
                {s.path || `gs://${process.env.NEXT_PUBLIC_GCP_BUCKET || ""}/content/sets/${s.id}/`}
              </td>
              <td className="p-2 border-r">{s.count ?? "-"}</td>
              <td className="p-2 border-r">{s.exam ?? "-"}</td>
              <td className="p-2">
                <button
                  className="px-3 py-1 rounded bg-black text-white"
                  onClick={() => importSet(s.id)}
                >
                  Import
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <a
          className="underline text-blue-600"
          href="/drills"
        >
          Go to Drills →
        </a>
      </div>
    </main>
  );
}
