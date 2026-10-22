import "server-only";

import { notFound } from "next/navigation";

import { getSetForViewer, type SetViewResult } from "@/lib/queries/set-view";
import { requireUser } from "@/lib/session";
import { setIdSchema } from "@/lib/validators/set";

/** Shared loader for set pages: validates the id, requires login, 404s when not visible. */
export async function loadSetPage(
  params: Promise<{ id: string }>,
): Promise<Exclude<SetViewResult, { status: "not_found" }>> {
  const user = await requireUser();
  const id = setIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await getSetForViewer(id.data, user.id);
  if (result.status === "not_found") notFound();
  return result;
}
