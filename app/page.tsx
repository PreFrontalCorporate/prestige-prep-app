import Link from "next/link";

export default function Home() {
  return (
    <div className="container-narrow space-y-8">
      <h1 className="h1">Prestige Prep</h1>
      <p className="text-slate-600">
        High-fidelity SAT/ACT practice with strict attendance, timing, and analytics.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/dashboard" className="pp-card p-5 hover:shadow-md transition">
          <div className="h3 mb-1">Dashboard</div>
          <p className="text-sm text-slate-600">Progress, streaks, and goals.</p>
        </Link>
        <Link href="/drills" className="pp-card p-5 hover:shadow-md transition">
          <div className="h3 mb-1">Drill Runner</div>
          <p className="text-sm text-slate-600">Timed items with scoring.</p>
        </Link>
        <Link href="/attendance" className="pp-card p-5 hover:shadow-md transition">
          <div className="h3 mb-1">Attendance</div>
          <p className="text-sm text-slate-600">Daily check-in & strict locks.</p>
        </Link>
      </div>
    </div>
  );
}
