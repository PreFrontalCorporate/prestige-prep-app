// app/drills/page.tsx
import Link from 'next/link';

export default function DrillsPage() {
  // Placeholder until a set is imported
  return (
    <main className="container mx-auto px-4 pt-10">
      <h1 className="text-3xl font-semibold mb-6">Drill Runner</h1>

      <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <p className="text-slate-700">
          No set loaded{' '}
          <Link className="text-blue-600 hover:underline" href="/admin/content">
            Go to Content Admin
          </Link>{' '}
          and Import a set.
        </p>
      </div>
    </main>
  );
}
