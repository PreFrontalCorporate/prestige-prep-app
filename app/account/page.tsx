// app/account/page.tsx
import { getServerSession } from "next-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession();

  const isAuthed = !!session?.user;
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? "";

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      {!isAuthed ? (
        <div className="space-y-4">
          <p className="text-sm">
            You’re not signed in.{" "}
            <Link
              className="underline"
              href="/api/auth/signin?callbackUrl=/account"
            >
              Sign in with Google
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name || email}
                className="h-14 w-14 rounded-full border"
              />
            ) : null}
            <div>
              <div className="font-medium">{name || email}</div>
              <div className="text-sm text-gray-500">{email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/auth/signout?callbackUrl=/"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Sign out
            </a>
            <Link
              href="/drills"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Back to Drills
            </Link>
          </div>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600">
              Session debug
            </summary>
            <pre className="mt-3 text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
{JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
