import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SetEditor } from "@/components/set-editor/set-editor";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setIdSchema } from "@/lib/validators/set";

export const metadata: Metadata = { title: "To'plamni tahrirlash" };

export default async function EditSetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const parsedId = setIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();

  // Only the owner can edit; anyone else gets a 404 so private sets are not revealed.
  const set = await db.set.findFirst({
    where: { id: parsedId.data, ownerId: user.id },
    select: {
      id: true,
      title: true,
      description: true,
      visibility: true,
      passwordHash: true,
      cards: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, term: true, definition: true, position: true },
      },
    },
  });
  if (!set) notFound();

  return (
    <SetEditor
      key={set.id}
      initial={{
        setId: set.id,
        title: set.title,
        description: set.description ?? "",
        visibility: set.visibility,
        hasPassword: set.passwordHash !== null,
        cards: set.cards,
      }}
    />
  );
}
