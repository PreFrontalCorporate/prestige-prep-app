export default function Dashboard() {
  return (
    <main className="p-8 space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Today’s goal: Complete one SAT Math timed set (10 items / 13 minutes).</li>
        <li>Strict policy: Module 1 accuracy ≥ 98% before Module 2 unlock.</li>
        <li>Streak: 0 days (start now!)</li>
      </ul>
    </main>
  );
}
