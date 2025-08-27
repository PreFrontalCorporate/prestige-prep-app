import { NextResponse } from "next/server";

type SetMeta = {
  id: string;
  exam?: string;
  count?: number;
  path?: string;
};

async function getSets(): Promise<SetMeta[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/contentSets`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.sets ?? [];
}

export default async function ContentAdminPage() {
  const sets = await getSets();

  return (
    <div className="container-narrow space-y-6">
      <h1 className="h1">Content Admin</h1>

      {sets.length === 0 && (
        <div className="pp-card p-6">
          <p className="text-slate-700 mb-3">No sets found.</p>
          <a className="text-brand-700 underline" href="/drills">Go to Drills →</a>
        </div>
      )}

      {sets.length > 0 && (
        <div className="pp-card p-4">
          <table className="pp-table">
            <thead>
              <tr>
                <th className="pp-th">Set</th>
                <th className="pp-th">GCS Path</th>
                <th className="pp-th">Count</th>
                <th className="pp-th">Exam</th>
                <th className="pp-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => (
                <tr key={s.id}>
                  <td className="pp-td">{s.id}</td>
                  <td className="pp-td text-slate-500">{s.path ?? ""}</td>
                  <td className="pp-td">{s.count ?? "-"}</td>
                  <td className="pp-td">{s.exam ?? "-"}</td>
                  <td className="pp-td">
                    <form action={`/api/loadSet?set=${encodeURIComponent(s.id)}`} method="POST">
                      <button className="pp-btn-primary">Import</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <a className="text-brand-700 underline" href="/drills">Go to Drills →</a>
      </div>
    </div>
  );
}
