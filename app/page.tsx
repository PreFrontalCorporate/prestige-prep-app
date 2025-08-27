// app/page.tsx
import Link from 'next/link';

const Card = ({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) => (
  <Link
    href={href}
    className="block rounded-2xl bg-white px-6 py-5 shadow-md ring-1 ring-slate-100 hover:shadow-lg transition"
  >
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-slate-600 text-sm mt-1">{desc}</div>
  </Link>
);

export default function Home() {
  return (
    <main className="container mx-auto px-4 pt-12">
      <h1 className="text-4xl font-semibold">Prestige Prep</h1>
      <p className="text-slate-600 mt-3 max-w-2xl">
        High-fidelity SAT/ACT practice with strict attendance, timing, and
        analytics.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
        <Card
          href="/dashboard"
          title="Dashboard"
          desc="Progress, streaks, and goals."
        />
        <Card
          href="/drills"
          title="Drill Runner"
          desc="Timed items with scoring."
        />
        <Card
          href="/attendance"
          title="Attendance"
          desc="Daily check-in & strict locks."
        />
      </div>
    </main>
  );
}
