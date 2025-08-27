// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Prestige Prep",
  description:
    "High-fidelity SAT/ACT practice with strict attendance, timing, and analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full text-slate-800">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm">
            <Link href="/" className="mr-4 font-semibold">Prestige Prep</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/drills">Drill Runner</Link>
            <Link href="/attendance">Attendance</Link>
            <span className="text-slate-300">|</span>
            <Link href="/admin/content">Content Admin</Link>
            <Link href="/admin/agent">Content Agent</Link>
            <Link href="/admin/web">Web Agent</Link>
            <Link href="/methods">Methods</Link>
            <Link href="/recommended">Recommended</Link>
          </nav>
        </header>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
