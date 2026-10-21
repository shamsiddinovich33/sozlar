import { db } from "@/lib/db";

export type TakenField = "email" | "username";

/** Returns which of the given unique fields already belong to another user. */
export async function findTakenFields(email: string, username: string): Promise<TakenField[]> {
  const existing = await db.user.findMany({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  const taken: TakenField[] = [];
  if (existing.some((u) => u.email === email)) taken.push("email");
  if (existing.some((u) => u.username === username)) taken.push("username");
  return taken;
}
