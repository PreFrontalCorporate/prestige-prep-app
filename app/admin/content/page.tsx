"use client";

import { useEffect, useState } from "react";

type SetMeta = { name: string; exam: string; count: number; path: string };

export default function ContentAdminPage() {
  const [sets, setSets] = useState<SetMeta[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/contentSets", { cache: "no-store" });
      const j = await res.json();
      setSets(j.sets || []);
    })();
  }, []);

  async function importSet(name: string) {
    setStatus("Importing…");
    setLoading(name);
    try {
      const res = await fetch("/api/loadSet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ setName: name }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setStatus(
        `Imported ${name} (${j.meta?.count ?? "…"} items) — current set updated`
      );
    } catch (e: any) {
      setStatus(`Import failed: ${e.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Content Admin</h1>
      <p className="text-sm text-gray-600 mb-4">
        Import generated sets into the app.
      </p>

      {status && (
        <div className="mb-4 text-sm border rounded p-2 bg-gray-50">{status}</div>
      )}

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left">Set</th>
            <th className="p-2 text-left">Count</th>
            <th className="p-2 text-left">Exam</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((s) => (
            <tr key={s.name} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.count}</td>
              <td className="p-2">{s.exam}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => importSet(s.name)}
                  disabled={loading === s.name}
                  className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading === s.name ? "Importing…" : "Import"}
                </button>
              </td>
            </tr>
          ))}
          {sets.length === 0 && (
            <tr>
              <td className="p-2" colSpan={4}>
                No sets found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
