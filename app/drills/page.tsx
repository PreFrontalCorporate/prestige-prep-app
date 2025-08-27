"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  section?: string;
  tags?: string[];
  difficulty?: number;
  stem?: string;
  choices?: string[];
  answer?: string;
};

export default function DrillsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [setId, setSetId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/items", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
      setSetId(data.setId ?? null);
    })();
  }, []);

  const item = items[idx];

  return (
    <div className="container-narrow space-y-6">
      <h1 className="h1">Drill Runner</h1>

      {!item && (
        <div className="pp-card p-6">
          <p className="text-slate-700">
            No set loaded<br />
            <a className="text-brand-700 underline" href="/admin/content">Go to Content Admin</a> and Import a set.
          </p>
        </div>
      )}

      {item && (
        <div className="pp-card p-6 space-y-3">
          <div className="text-sm text-slate-500">
            Set: <span className="font-medium text-slate-700">{setId}</span>
          </div>
          <div className="text-sm text-slate-500">
            {idx + 1} / {items.length} • {item.section ?? "Section"} • {item.tags?.join(" / ") ?? "Tags"} • diff {item.difficulty ?? "-"}
          </div>
          <div className="text-lg">{item.stem}</div>
          <div className="grid sm:grid-cols-2 gap-2 mt-3">
            {item.choices?.map((c, i) => (
              <button key={i} className="pp-btn-ghost border border-slate-200 hover:border-brand-300">
                {c}
              </button>
            ))}
          </div>
          <div className="pt-4">
            <button
              className="pp-btn-primary"
              onClick={() => setIdx((i) => Math.min(i + 1, items.length - 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
