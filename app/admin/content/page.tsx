// app/admin/content/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ContentSet = {
  name: string;
  gcsPath?: string | null;
  count?: number | null;
  exam?: string | null;
};

export default function ContentAdminPage() {
  const [rows, setRows] = useState<ContentSet[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      setMsg(null);
      const res = await fetch('/api/contentSets', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const sets: ContentSet[] = Array.isArray(data) ? data : data.sets || [];
      setRows(sets);
    } catch (e: any) {
      setMsg(`Failed to load content sets: ${e?.message ?? e}`);
      setRows([]);
    }
  }

  async function importSet(name: string) {
    try {
      setLoading(true);
      setMsg(`Importing "${name}"...`);
      const res = await fetch('/api/loadSet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setName: name }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setMsg(`Imported "${name}". You can now run drills.`);
      await load();
    } catch (e: any) {
      setMsg(`Import failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="pb-12">
      <h1 className="text-3xl font-bold tracking-tight">Content Admin</h1>
      <p className="mt-2 text-slate-600">Import generated sets into the app.</p>

      {msg && (
        <div className="mt-4 text-sm rounded-lg border p-3 bg-yellow-50 border-yellow-200 text-yellow-900">
          {msg}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Set</th>
              <th className="px-4 py-2 text-left font-medium">GCS Path</th>
              <th className="px-4 py-2 text-left font-medium">Count</th>
              <th className="px-4 py-2 text-left font-medium">Exam</th>
              <th className="px-4 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No sets found.
                </td>
              </tr>
            )}

            {(rows ?? []).map((r) => (
              <tr key={r.name} className="border-t">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{r.gcsPath ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{r.count ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{r.exam ?? '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => importSet(r.name)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    aria-label={`Import ${r.name}`}
                  >
                    {loading ? 'Working…' : 'Import'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link className="text-blue-600 hover:underline" href="/drills">
          Go to Drills →
        </Link>
      </div>
    </div>
  );
}
