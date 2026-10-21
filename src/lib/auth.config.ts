import type { NextAuthConfig } from "next-auth";

/** Route prefixes that require an authenticated user. */
export const PROTECTED_PREFIXES = ["/dashboard", "/library", "/profile", "/sets"];
/** Routes a signed-in user should not see (redirected to the dashboard). */
export const GUEST_ONLY_ROUTES = ["/", "/login", "/register"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Edge-safe Auth.js config (no Prisma, no bcrypt).
 * Used by middleware; extended with providers + adapter in `src/lib/auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (isProtectedPath(pathname)) return isLoggedIn;

      if (isLoggedIn && GUEST_ONLY_ROUTES.includes(pathname)) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.username = token.username ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
