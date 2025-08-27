// app/admin/content/page.tsx
import { headers } from 'next/headers';
import { absoluteUrl } from '@/lib/base-url';
import { revalidatePath } from 'next/cache';

type SetInfo = {
  name: string;
  exam?: string;
  count?: number | null;
  gcsPath?: string | null;
};

async function fetchSets() {
  const hdrs = headers();
  const res = await fetch(absoluteUrl('/api/contentSets', hdrs), {
    cache: 'no-store',
  });
  if (!res.ok) return [] as SetInfo[];
  const json = await res.json().catch(() => ({}));
  return (json?.sets ?? []) as SetInfo[];
}

export default async function ContentAdminPage() {
  const sets = await fetchSets();

  async function importSetAction(formData: FormData) {
    'use server';
    const setName = String(formData.get('set') ?? '').trim();
    if (!setName) return;
    const hdrs = headers();
    await fetch(absoluteUrl('/api/loadSet', hdrs), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setName }),
      cache: 'no-store',
    });
    revalidatePath('/drills');
    revalidatePath('/admin/content');
  }

  return (
    <main className="container mx-auto px-4 pt-10">
      <h1 className="text-3xl font-semibold mb-6">Content Admin</h1>

      {sets.length === 0 ? (
        <div className="rounded-lg border bg-white shadow-sm p-6">
          <p className="text-slate-700 mb-2">No sets found.</p>
          <a className="text-blue-600 hover:underline" href="/drills">
            Go to Drills →
          </a>
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Set</th>
                <th className="text-left px-4 py-3">GCS Path</th>
                <th className="text-left px-4 py-3">Count</th>
                <th className="text-left px-4 py-3">Exam</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => (
                <tr key={s.name} className="border-t">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.gcsPath ?? '—'}</td>
                  <td className="px-4 py-3">{s.count ?? '—'}</td>
                  <td className="px-4 py-3">{s.exam ?? '—'}</td>
                  <td className="px-4 py-3">
                    <form action={importSetAction}>
                      <input type="hidden" name="set" value={s.name} />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 transition"
                      >
                        Import
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <a className="text-blue-600 hover:underline" href="/drills">
          Go to Drills →
        </a>
      </div>
    </main>
  );
}
