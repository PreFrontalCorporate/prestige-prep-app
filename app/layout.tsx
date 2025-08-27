export const metadata = { title: "Prestige Prep", description: "Elite SAT/ACT training" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen bg-gray-50 text-gray-900">{children}</body></html>
  );
}
