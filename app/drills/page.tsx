// app/drills/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id?: string;
  exam?: string;
  section?: string;
  category?: string;
  type?: string;
  difficulty?: number;
  tags?: string[];
  stem_latex?: string;
  choices?: Record<string, string>;
  answer?: string;
  explanation_latex?: string;
};

export default function DrillRunner() {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [setName, setSetName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // pull everything for now (small sets); could page later with ?limit=...
      const res = await fetch("/api/items?limit=0", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setSetName(data.set || null);
      setIdx(0);
      setScore(0);
      setPicked(null);
      setChecked(false);
    })();
  }, []);

  const item = items[idx];

  const choiceKeys = useMemo(() => {
    if (!item?.choices) return [];
    return Object.keys(item.choices).sort(); // A,B,C,D
  }, [item]);

  function check() {
    if (!item || picked == null) return;
    setChecked(true);
    if (picked === item.answer) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    setPicked(null);
    setChecked(false);
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1);
    }
  }

  const total = items.length || 0;
  const done = idx >= total - 1;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Drill Runner</h1>
      <div className="text-sm text-gray-600">
        {setName ? `Set: ${setName}` : "No set loaded"}
        {total ? ` • ${idx + 1} / ${total}` : ""}
        {total ? ` • Score: ${score} / ${total}` : ""}
      </div>

      {!item ? (
        <p>No items. Go to <a className="underline" href="/admin/content">Content Admin</a> and Import a set.</p>
      ) : (
        <div className="space-y-3">
          <div className="text-gray-500 text-sm">
            {item.section} / {item.type} • {item.category} • diff {item.difficulty}
          </div>
          <div className="whitespace-pre-wrap">
            {/* Keeping raw LaTeX text; can wire KaTeX later */}
            {item.stem_latex || "(no question text)"}
          </div>

          <div className="space-y-2">
            {choiceKeys.map((k) => (
              <label key={k} className={`block p-2 border rounded ${checked && k === item.answer ? "bg-green-50 border-green-300" : ""}`}>
                <input
                  type="radio"
                  name="choice"
                  className="mr-2"
                  disabled={checked}
                  checked={picked === k}
                  onChange={() => setPicked(k)}
                />
                <strong>{k}.</strong> {item.choices?.[k]}
              </label>
            ))}
          </div>

          {!checked ? (
            <button
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={check}
              disabled={picked == null}
            >
              Check
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                {picked === item.answer ? (
                  <span className="text-green-700 font-medium">Correct ✅</span>
                ) : (
                  <span className="text-red-700 font-medium">
                    Incorrect ❌ (correct: {item.answer})
                  </span>
                )}
              </div>
              {item.explanation_latex && (
                <div className="p-3 bg-gray-50 border rounded whitespace-pre-wrap">
                  {item.explanation_latex}
                </div>
              )}
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                onClick={next}
                disabled={done}
              >
                {done ? "Done" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
