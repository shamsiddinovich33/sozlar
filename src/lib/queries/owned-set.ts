import "server-only";

import type { Prisma } from "@prisma/client";

import { ACTION_ERRORS, ActionError } from "@/lib/action";
import { db } from "@/lib/db";

/** Loads a set only if `userId` owns it; otherwise throws a "not found" action error. */
export async function getOwnedSetOrThrow<S extends Prisma.SetSelect>(
  setId: string,
  userId: string,
  select: S,
  client: Prisma.TransactionClient = db,
): Promise<Prisma.SetGetPayload<{ select: S }>> {
  const set = await client.set.findFirst({ where: { id: setId, ownerId: userId }, select });
  if (!set) throw new ActionError(ACTION_ERRORS.notFound);
  return set;
}
