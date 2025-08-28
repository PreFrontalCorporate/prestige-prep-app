'use client';

import { useEffect, useMemo, useState } from 'react';

type SetRow = {
  id: string;         // setName, e.g. "sat-smoke-YYYYMMDD-HHMMSS"
  exam: string;       // "SAT", etc.
  createdAt?: string; // ISO timestamp (optional)
  count?: number;     // hydrated client-side
};

type SetsApi = { sets: Array<{ id: string; exam: string; createdAt?: string }> };
type CountApi = { set: string; count: number };

export default function ContentAdminPage() {
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySet, setBusySet] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null); // success/error banner
  const [currentSet, setCurrentSet] = useState<{ id?: string; count?: number }>({});

  // Load sets + current set on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);

        // 1) List sets
        const res = await fetch('/api/contentSets', { cache: 'no-store' });
        if (!res.ok) throw new Error(`GET /api/contentSets → ${res.status}`);
        const body: SetsApi = await res.json();

        // 2) Seed table
        let table: SetRow[] = body.sets.map(s => ({ id: s.id, exam: s.exam, createdAt: s.createdAt }));

        // 3) Hydrate counts (parallel)
        table = await Promise.all(
          table.map(async (row) => {
            try {
              const rc = await fetch(`/api/items?limit=0&set=${encodeURIComponent(row.id)}`, { cache: 'no-store' });
              if (rc.ok) {
                const j: CountApi = await rc.json();
                return { ...row, count: j.count };
              }
            } catch {}
            return row;
          })
        );

        if (cancelled) return;
        setSets(table);

        // 4) Current set
        try {
          const cur = await fetch('/api/currentSet', { cache: 'no-store' });
          if (cur.ok) {
            const j = await cur.json(); // { set: string, count?: number }
            if (!cancelled) setCurrentSet({ id: j.set, count: j.count });
          }
        } catch {}
      } catch (err: any) {
        if (!cancelled) setFlash(`Failed to load sets: ${err?.message ?? String(err)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const currentText = useMemo(() => {
    const id = currentSet.id ?? '—';
    const c  = typeof currentSet.count === 'number' ? currentSet.count : 0;
    return `Current set: ${id} · ${c} items`;
  }, [currentSet]);

  async function handleImport(setName: string) {
    setFlash(null);
    setBusySet(setName);
    try {
      const res = await fetch('/api/loadSet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setName }),
        cache: 'no-store',
      });

      if (!res.ok) {
        let text = '';
        try { text = await res.text(); } catch {}
        throw new Error(`HTTP ${res.status}${text ? ` – ${text}` : ''}`);
      }

      // Reload the current set display + rehydrate counts after a successful import
      try {
        const cur = await fetch('/api/currentSet', { cache: 'no-store' });
        if (cur.ok) {
          const j = await cur.json();
          setCurrentSet({ id: j.set, count: j.count });
        }
      } catch {}

      setFlash(`Imported ${setName} successfully.`);
    } catch (err: any) {
      setFlash(`Import failed: ${err?.message ?? String(err)}`);
    } finally {
      setBusySet(null);
    }
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="mt-8 md:mt-12 text-3xl font-bold tracking-tight">Content Admin</h1>
      <p className="mt-2 text-slate-600">Import generated sets into the app.</p>

      <div className="mt-4 rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {currentText}
      </div>

      {flash && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {flash}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Set</th>
              <th className="px-4 py-3">GCS Path</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading && (
              <tr><td className="px-4 py-5 text-slate-500" colSpan={5}>Loading…</td></tr>
            )}

            {!loading && sets.length === 0 && (
              <tr><td className="px-4 py-5 text-slate-500" colSpan={5}>No sets found.</td></tr>
            )}

            {sets.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-4 font-mono text-[13px]">{s.id}</td>
                <td className="px-4 py-4 text-slate-400">—</td>
                <td className="px-4 py-4">{typeof s.count === 'number' ? s.count : '—'}</td>
                <td className="px-4 py-4">{s.exam}</td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleImport(s.id)}
                    disabled={!!busySet}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-white shadow hover:bg-blue-700 disabled:opacity-60"
                  >
                    {busySet === s.id ? 'Importing…' : 'Import'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6">
        <a className="text-blue-600 hover:underline" href="/drills">Go to Drills →</a>
      </p>
    </div>
  );
}
