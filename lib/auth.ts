// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth configuration (JWT sessions).
 * We don't persist users yet; we rely on provider profile + JWT.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      // First sign-in: copy interesting bits
      if (account && profile) {
        token.email = (profile as any).email ?? token.email;
        token.name = (profile as any).name ?? token.name;
        token.picture = (profile as any).picture ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string | undefined;
        session.user.name = token.name as string | undefined;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
};
