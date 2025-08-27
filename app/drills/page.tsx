"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string; prompt: string;
  options: Record<string,string>; answer: string;
  time_target_sec: number;
};

const demoItems: Item[] = [
  {
    id: "SAT-MATH-LIN-CCR-0001",
    prompt: "If $3x - 5 = 10$, what is $x$?",
    options: { A:"3", B:"5", C:"15", D:"10/3" },
    answer: "B",
    time_target_sec: 60
  }
];

export default function Drills() {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, [idx]);

  const item = demoItems[idx];

  function submit(choice: string) {
    setChosen(choice);
    if (choice === item.answer) setCorrectCount(c => c + 1);
  }
  function next() {
    setChosen(null); setElapsed(0);
    setIdx(i => Math.min(i + 1, demoItems.length - 1));
  }

  return (
    <main className="p-8 space-y-4">
      <h2 className="text-2xl font-semibold">Drill Runner</h2>
      <div className="p-4 rounded-md bg-white shadow">
        <div className="flex justify-between mb-2">
          <span>Item {idx + 1} / {demoItems.length}</span>
          <span className="font-mono">Time: {elapsed}s</span>
        </div>
        <p className="mb-4">{item.prompt}</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(item.options).map(([k, v]) => (
            <button key={k} onClick={() => submit(k)}
              className={`border rounded p-2 text-left ${chosen===k ? "bg-blue-100" : "bg-gray-50 hover:bg-gray-100"}`}>
              <span className="font-semibold mr-2">{k}.</span>{v}
            </button>
          ))}
        </div>
        {chosen && (
          <div className="mt-4">
            {chosen === item.answer
              ? <p className="text-green-600">Correct ✅</p>
              : <p className="text-red-600">Incorrect ❌ — Answer is {item.answer}</p>}
            <button onClick={next} className="mt-3 px-3 py-1 rounded bg-black text-white">Next</button>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600">Score: {correctCount} / {idx + 1}</div>
    </main>
  );
}
