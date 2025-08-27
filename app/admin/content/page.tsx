// app/admin/content/page.tsx
"use client";

import { useEffect, useState } from "react";

type SetMeta = {
  id: string;
  exam?: string;
  count?: number;
  path?: string;
  createdAt?: string | number;
};

export default function ContentAdminPage() {
  const [sets, setSets] = useState<SetMeta[]>([]);
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    setMsg("");
    try {
      const res = await fetch("/api/contentSets", { cache: "no-store" });
      const data = await res.json();
      setSets(data.sets || []);
    } catch (e: any) {
      setMsg(`Failed to load sets: ${String(e)}`);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function importSet(id: string) {
    setMsg(`Importing ${id}…`);
    try {
      // GET is allowed by our /api/loadSet, but POST also works.
      const resp = await fetch(`/api/loadSet?set=${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await resp.json();
      if (data?.ok) {
        setMsg(`Imported ${data.count ?? 0} items from ${id}.`);
      } else {
        setMsg(`Import failed: ${data?.error || "unknown error"}`);
      }
    } catch (e: any) {
      setMsg(`Import error: ${String(e)}`);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Content Admin</h1>
      {msg && <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">{msg}</div>}
      <table className="min-w-full text-left border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Set</th>
            <th className="p-2 border">GCS Path</th>
            <th className="p-2 border">Count</th>
            <th className="p-2 border">Exam</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.length === 0 ? (
            <tr>
              <td className="p-2 border" colSpan={5}>No sets found.</td>
            </tr>
          ) : (
            sets.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">{s.id}</td>
                <td className="p-2 border">{s.path || ""}</td>
                <td className="p-2 border">{s.count ?? "-"}</td>
                <td className="p-2 border">{s.exam || ""}</td>
                <td className="p-2 border">
                  <button
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                    onClick={() => importSet(s.id)}
                  >
                    Import
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <a className="underline" href="/drills">Go to Drills →</a>
    </main>
  );
}
