// app/admin/content/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ContentSetWire = {
  id?: string;          // what /api/contentSets returns today
  name?: string;        // future friendly
  gcsPath?: string | null;
  count?: number | null;
  exam?: string | null;
  createdAt?: string;
};

type Row = {
  id: string;
  name?: string;
  gcsPath?: string | null;
  count?: number | null;
  exam?: string | null;
  createdAt?: string;
};

export default function ContentAdminPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState<{ set?: string; count?: number } | null>(null);

  const prettyRows = useMemo(() => rows ?? [], [rows]);

  async function loadSets() {
    try {
      setMsg(null);
      // 1) list sets
      const res = await fetch('/api/contentSets', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const wire: ContentSetWire[] = Array.isArray(data) ? data : data.sets || [];

      const mapped: Row[] = wire.map((s) => ({
        id: s.id || s.name || 'unknown',
        name: s.name,
        gcsPath: s.gcsPath ?? null,
        count: s.count ?? null,
        exam: s.exam ?? null,
        createdAt: s.createdAt,
      }));

      setRows(mapped);

      // 2) load current set
      try {
        const cs = await fetch('/api/currentSet', { cache: 'no-store' });
        if (cs.ok) {
          const csJson = await cs.json();
          setCurrentSet({ set: csJson?.set, count: csJson?.count });
        }
      } catch {}

      // 3) hydrate counts per set (best-effort)
      // Try /api/items?limit=0&set=<id> for each; if it fails, skip.
      const withCounts = await Promise.all(
        mapped.map(async (r) => {
          try {
            const q = new URLSearchParams({ limit: '0', set: r.id }).toString();
            const rItems = await fetch(`/api/items?${q}`, { cache: 'no-store' });
            if (rItems.ok) {
              const j = await rItems.json();
              return { ...r, count: typeof j?.count === 'number' ? j.count : r.count ?? null };
            }
          } catch {}
          return r;
        })
      );

      setRows(withCounts);
    } catch (e: any) {
      setMsg(`Failed to load content sets: ${e?.message ?? e}`);
      setRows([]);
    }
  }

  async function importSet(idOrName: string) {
    try {
      setLoading(true);
      setMsg(`Importing "${idOrName}"...`);
      const res = await fetch('/api/loadSet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setName: idOrName }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setMsg(`Imported "${idOrName}". You can now run drills.`);
      await loadSets();
    } catch (e: any) {
      setMsg(`Import failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSets();
  }, []);

  return (
    <div className="pb-12">
      <h1 className="text-3xl font-bold tracking-tight">Content Admin</h1>
      <p className="mt-2 text-slate-600">Import generated sets into the app.</p>

      {currentSet?.set && (
        <div className="mt-4 text-sm rounded-lg border p-3 bg-slate-50 border-slate-200 text-slate-800">
          <b>Current set:</b> {currentSet.set}
          {typeof currentSet.count === 'number' ? ` · ${currentSet.count} items` : ''}
        </div>
      )}

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
            {prettyRows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No sets found.
                </td>
              </tr>
            )}

            {prettyRows.map((r) => {
              const displayName = r.name ?? r.id;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {displayName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.gcsPath ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {typeof r.count === 'number' ? r.count : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.exam ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => importSet(r.id)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      aria-label={`Import ${displayName}`}
                    >
                      {loading ? 'Working…' : 'Import'}
                    </button>
                  </td>
                </tr>
              );
            })}
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
