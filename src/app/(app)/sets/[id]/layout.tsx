import type { ReactNode } from "react";

import { loadSetPage } from "@/lib/queries/viewer-page";

/**
 * Checks access before anything streams, so unknown or private sets get a real 404 status
 * (a notFound() thrown inside the page would come after the loading skeleton was sent).
 * The result is cached per request, so the pages reuse it.
 */
export default async function SetLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await loadSetPage(params);
  return children;
}
