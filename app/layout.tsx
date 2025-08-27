import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Prestige Prep",
  description: "High-fidelity SAT/ACT practice with strict attendance, timing, and analytics.",
};

export const viewport: Viewport = { themeColor: "#0f6be6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b border-slate-200">
          <div className="container-wide py-4 flex items-center gap-6">
            <Link href="/" className="text-xl font-semibold text-slate-900">Prestige Prep</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link className="hover:text-brand-700" href="/dashboard">Dashboard</Link>
              <Link className="hover:text-brand-700" href="/drills">Drill Runner</Link>
              <Link className="hover:text-brand-700" href="/attendance">Attendance</Link>
              <span className="text-slate-300">|</span>
              <Link className="hover:text-brand-700" href="/admin/content">Content Admin</Link>
              <Link className="hover:text-brand-700" href="/admin/agent">Content Agent</Link>
              <Link className="hover:text-brand-700" href="/admin/web">Web Agent</Link>
              <Link className="hover:text-brand-700" href="/methods">Methods</Link>
              <Link className="hover:text-brand-700" href="/recommended">Recommended</Link>
            </nav>
          </div>
        </header>
        <main className="py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
