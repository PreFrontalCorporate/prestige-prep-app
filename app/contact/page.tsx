// app/contact/page.tsx
export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 pt-10">
      <h1 className="text-3xl font-semibold mb-4">Contact Us</h1>
      <p className="text-slate-700 max-w-3xl">
        Email us at{' '}
        <a className="text-blue-600 hover:underline" href="mailto:donkey.right.productions@gmail.com">
          donkey.right.productions@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
