import "server-only";

import { Visibility, type Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/** Sets added to a study group the user belongs to. */
function sharedWithUser(userId: string): Prisma.SetWhereInput {
  return { groupSets: { some: { group: { members: { some: { userId } } } } } };
}

/**
 * Sets a user can see in lists and stats: their own, anyone's non-private set, and sets shared
 * with one of their study groups. (Password-protected sets still need unlocking to open.)
 */
export function setVisibleTo(userId: string): Prisma.SetWhereInput {
  return {
    OR: [{ ownerId: userId }, { visibility: { not: Visibility.PRIVATE } }, sharedWithUser(userId)],
  };
}

export async function isSharedWithUserGroup(setId: string, userId: string): Promise<boolean> {
  const shared = await db.groupSet.findFirst({
    where: { setId, group: { members: { some: { userId } } } },
    select: { setId: true },
  });
  return shared !== null;
}
