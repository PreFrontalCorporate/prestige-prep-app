import Link from "next/link";
export default function Home() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold">Prestige Prep</h1>
      <p className="text-gray-700">High-fidelity SAT/ACT practice with strict attendance, timing, and analytics.</p>
      <div className="flex gap-4">
        <Link className="underline" href="/dashboard">Dashboard</Link>
        <Link className="underline" href="/drills">Drill Runner</Link>
        <Link className="underline" href="/attendance">Attendance</Link>
      </div>
    </main>
  );
}
