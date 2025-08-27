// app/methods/page.tsx
import Link from "next/link";

const METHODS: { slug: string; title: string; blurb: string }[] = [
  { slug: "active-recall", title: "Active Recall", blurb: "Pull answers from memory instead of rereading." },
  { slug: "spaced-repetition", title: "Spaced Repetition", blurb: "Review at increasing intervals to lock it in." },
  { slug: "interleaving", title: "Interleaving", blurb: "Mix topics to strengthen flexible recall." },
  { slug: "deliberate-practice", title: "Deliberate Practice", blurb: "Target weak skills with focused reps." },
  { slug: "mastery-learning", title: "Mastery Learning", blurb: "Advance only after a high accuracy threshold." },
  { slug: "worked-examples", title: "Worked Examples", blurb: "Study step-by-step solutions before solo attempts." },
  { slug: "fading", title: "Fading (Scaffold Reduction)", blurb: "Gradually remove hints until you’re independent." },
  { slug: "retrieval-confidence", title: "Retrieval + Confidence", blurb: "Answer and rate confidence for calibrated learning." },
  { slug: "timed-drills", title: "Timed Drills & Benchmarks", blurb: "Practice under time to match the real test." },
  { slug: "error-logging", title: "Error Logging & Reflection", blurb: "Capture mistakes and review them deliberately." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Learning Methods</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METHODS.map((m) => (
          <Link
            key={m.slug}
            href={`/methods/${m.slug}`}
            className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md"
          >
            <div className="font-semibold">{m.title}</div>
            <div className="mt-1 text-sm text-gray-600">{m.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
