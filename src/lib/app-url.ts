import "server-only";

import { headers } from "next/headers";

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);

/**
 * Public base URL for links in emails. Configured URLs come first, so a forged Host header can
 * never put another site into a reset link; the request host is only a development fallback.
 * In production a leftover localhost value is skipped.
 */
export async function getAppUrl(): Promise<string> {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    vercelUrl && `https://${vercelUrl}`,
  ].filter((url): url is string => !!url);
  const configured =
    process.env.NODE_ENV === "production" ? candidates.find((url) => !isLocal(url)) : candidates[0];
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
