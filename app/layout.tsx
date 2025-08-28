// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'Prestige Prep',
  description:
    'High-fidelity SAT/ACT practice with strict attendance, timing, and analytics.',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-slate-700 hover:text-slate-900 transition"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Header (kept slender) */}
        <header className="border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 h-12 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/prestige-logo.png"
                alt="Prestige Prep"
                width={28}
                height={28}
                className="rounded-full hidden sm:block"
              />
              <span className="font-semibold">Prestige Prep</span>
            </Link>

            <nav className="flex items-center gap-5">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/drills">Drill Runner</NavLink>
              <NavLink href="/attendance">Attendance</NavLink>
              <span className="text-slate-300">|</span>
              <NavLink href="/admin/content">Content Admin</NavLink>
              <NavLink href="/admin/agent">Content Agent</NavLink>
              <NavLink href="/admin/web">Web Agent</NavLink>
              <NavLink href="/methods">Methods</NavLink>
              <NavLink href="/recommended">Recommended</NavLink>
            </nav>
          </div>
        </header>

        {/* Page content (unified top spacing here) */}
        <main className="container mx-auto px-4 pt-8 md:pt-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t bg-white">
          <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              © {new Date().getFullYear()} <b>Prestige Prep Academy</b>. All rights
              reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link className="text-blue-600 hover:underline" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="text-blue-600 hover:underline" href="/contact">
                Contact Us
              </Link>
            </div>
          </div>
        </footer>

        {/* Observability */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

