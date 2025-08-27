// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 pt-10">
      <h1 className="text-3xl font-semibold mb-4">Privacy Policy</h1>
      <p className="text-slate-700 max-w-3xl">
        We respect your privacy. This app stores minimal data necessary for
        practice analytics (e.g., attempts, timing, and streaks). We never sell
        your data. Contact us at{' '}
        <a className="text-blue-600 hover:underline" href="mailto:donkey.right.productions@gmail.com">
          donkey.right.productions@gmail.com
        </a>{' '}
        with any questions.
      </p>
    </main>
  );
}
