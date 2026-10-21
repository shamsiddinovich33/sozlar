export const DEFAULT_REDIRECT = "/dashboard";

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
    if (path === "/" || path.startsWith("/login") || path.startsWith("/register")) {
      return DEFAULT_REDIRECT;
    }
    return path;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
