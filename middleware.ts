// middleware.ts
export { default } from "next-auth/middleware";

/**
 * Require login for drills, attendance, and all admin pages.
 * Unauthed users are redirected to /api/auth/signin (NextAuth default),
 * and then back to the original page after successful login.
 */
export const config = {
  matcher: ["/drills", "/attendance", "/admin/:path*"],
};
