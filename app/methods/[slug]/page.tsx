// app/methods/[slug]/page.tsx
import Link from "next/link";

const COPY: Record<
  string,
  { title: string; how: string[]; howApp: string[] }
> = {
  "active-recall": {
    title: "Active Recall",
    how: [
      "Answer from memory before revealing the solution.",
      "Prefer explain-back in your own words.",
    ],
    howApp: [
      "Use Drill Runner to answer before checking.",
      "Turn misses into focused sets via Recommended.",
    ],
  },
  "spaced-repetition": {
    title: "Spaced Repetition",
    how: [
      "Revisit items at increasing intervals.",
      "Stop reviewing items you consistently get right.",
    ],
    howApp: [
      "We’ll space reviews via recent attempts.",
      "Recommended suggests what to revisit next.",
    ],
  },
  "interleaving": {
    title: "Interleaving",
    how: [
      "Mix topics to boost flexible recall.",
      "Rotate sections instead of blocking a single type.",
    ],
    howApp: [
      "Switch sets quickly with the fast picker (coming).",
      "Recommended alternates topics you miss.",
    ],
  },
  "deliberate-practice": {
    title: "Deliberate Practice",
    how: [
      "Train at the edge of your ability—slightly hard.",
      "Get immediate feedback and retry.",
    ],
    howApp: [
      "Use difficulty tags to focus.",
      "Review explanations before re-attempting.",
    ],
  },
  "mastery-learning": {
    title: "Mastery Learning",
    how: [
      "Don’t advance until you hit a target accuracy.",
      "Measure accuracy per module/topic.",
    ],
    howApp: [
      "Strict policy gates Module 2 until you hit the threshold.",
      "Dashboard will summarize mastery (coming).",
    ],
  },
  "worked-examples": {
    title: "Worked Examples",
    how: [
      "Study step-by-step solutions first.",
      "Fade support as you improve.",
    ],
    howApp: [
      "Read explanations after each item.",
      "We’ll add hint fading over time.",
    ],
  },
  fading: {
    title: "Fading (Scaffold Reduction)",
    how: [
      "Start with heavy hints, remove them gradually.",
      "End with independent solving.",
    ],
    howApp: [
      "We’ll add lighter hints each retry (coming).",
      "Use confidence to decide when to fade.",
    ],
  },
  "retrieval-confidence": {
    title: "Retrieval + Confidence",
    how: [
      "Rate how sure you were after answering.",
      "Prioritize low-confidence correct answers for review.",
    ],
    howApp: [
      "We’ll store confidence with attempts (coming).",
      "Recommended will surface low-confidence areas.",
    ],
  },
  "timed-drills": {
    title: "Timed Drills & Benchmarks",
    how: [
      "Practice with the real timing per section.",
      "Compare your pace across attempts.",
    ],
    howApp: [
      "Drill Runner is timed; pace is tracked (coming).",
      "Dashboard will show benchmarks.",
    ],
  },
  "error-logging": {
    title: "Error Logging & Reflection",
    how: [
      "Log every miss and describe the misconception.",
      "Revisit the log weekly.",
    ],
    howApp: [
      "We’ll store attempts with tags and errors (coming).",
      "Recommended uses your recent 50 attempts.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(COPY).map((slug) => ({ slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const data = COPY[params.slug];
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Method not found</h1>
        <p className="mt-2">
          Go back to <Link className="text-blue-600" href="/methods">Methods</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <section>
        <h2 className="font-semibold">How it works</h2>
        <ul className="mt-2 list-disc pl-6 text-gray-700">
          {data.how.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">How the app supports it</h2>
        <ul className="mt-2 list-disc pl-6 text-gray-700">
          {data.howApp.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>
      <div>
        <Link className="text-blue-600" href="/methods">
          ← All methods
        </Link>
      </div>
    </div>
  );
}
