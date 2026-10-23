export const DEFAULT_REDIRECT = "/dashboard";

/** Never redirect back into the sign-in flow itself. */
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/session-ended",
];

/** "/register?callbackUrl=…" when there is a safe target to return to, else just the route. */
export function withCallback(route: string, callbackUrl: string | null | undefined): string {
  const target = callbackUrl ? safeRedirectPath(callbackUrl) : DEFAULT_REDIRECT;
  return target === DEFAULT_REDIRECT ? route : `${route}?callbackUrl=${encodeURIComponent(target)}`;
}

/**
 * Returns a same-site path for post-login redirects.
 * Absolute URLs are reduced to their path, so a user can never be sent to another origin.
 */
export function safeRedirectPath(target: string | null | undefined): string {
  if (!target) return DEFAULT_REDIRECT;
  try {
    const url = new URL(target, "http://local.invalid");
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_REDIRECT;
    if (path === "/" || AUTH_ROUTES.some((route) => path.startsWith(route))) {
      return DEFAULT_REDIRECT;
    }
    return path;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
