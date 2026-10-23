import { NextResponse, type NextRequest } from "next/server";

/**
 * Server Components cannot clear cookies, so a page that finds the session gone (for example,
 * the device was signed out from another one) redirects here. Clearing the stale session cookie
 * keeps the middleware from bouncing between /login and /dashboard.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const { name } of request.cookies.getAll()) {
    if (name.includes("authjs.session-token")) {
      response.cookies.set({
        name,
        value: "",
        maxAge: 0,
        path: "/",
        secure: name.startsWith("__Secure-"),
      });
    }
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
