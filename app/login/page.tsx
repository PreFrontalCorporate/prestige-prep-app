// app/login/page.tsx
export const dynamic = "force-static";

export default function Login() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <p className="mb-4">
        You’ll be redirected to Google and then back here.
      </p>
      <a
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border"
        href="/api/auth/signin"
      >
        Continue with Google
      </a>
    </main>
  );
}
