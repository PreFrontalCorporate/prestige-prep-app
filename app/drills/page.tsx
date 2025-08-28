"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  exam: string;
  section: string;
  category: string;
  type: string;
  difficulty: number;
  tags?: string[];
  stem_latex?: string;
  choices?: Record<string, string>;
  answer?: string;
  explanation_latex?: string;
};

export default function DrillRunnerPage() {
  const [setName, setSetName] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current set then items
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // get current set
        const csRes = await fetch("/api/currentSet", { cache: "no-store" });
        const cs = await csRes.json();
        const name = cs?.set ?? null;
        setSetName(name);

        if (!name) {
          setItems([]);
          setLoading(false);
          return;
        }

        // get items for the current set
        const itRes = await fetch(`/api/items?set=${encodeURIComponent(name)}`, {
          cache: "no-store",
        });
        const it = await itRes.json();

        if (!itRes.ok) throw new Error(it?.error || `HTTP ${itRes.status}`);
        setItems(it?.items ?? []);
      } catch (e: any) {
        setError(e?.message || String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Drill Runner</h1>
      <div className="text-sm text-gray-600">
        {setName ? (
          <>Current set: <span className="font-mono">{setName}</span></>
        ) : (
          <>No current set selected. Go to <a className="underline" href="/admin/content">Content Admin</a> and click “Import”.</>
        )}
      </div>

      {loading && <div className="text-sm">Loading items…</div>}
      {error && (
        <div className="text-sm border rounded p-2 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <div className="text-sm">No items found for this set.</div>
      )}

      {!loading && items && items.length > 0 && (
        <section className="space-y-3">
          <div className="text-sm text-gray-700">
            Loaded <b>{items.length}</b> items.
          </div>

          {/* Minimal preview of first few items */}
          <ul className="space-y-2">
            {items.slice(0, 5).map((it) => (
              <li key={it.id} className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {it.exam} · {it.section} · {it.category} · diff {it.difficulty}
                </div>
                <div className="font-medium mb-2">{it.id}</div>
                <div className="text-sm whitespace-pre-wrap">
                  {it.stem_latex || "(no stem provided)"}
                </div>
              </li>
            ))}
          </ul>

          {/* Placeholder controls for timers/locks to be added */}
          <div className="pt-2 text-xs text-gray-500">
            Timers/locks coming next…
          </div>
        </section>
      )}
    </main>
  );
}
