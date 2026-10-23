import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type { Mastery, Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/secret";
import { isSharedWithUserGroup } from "@/lib/queries/visibility";
import { decideSetAccess } from "@/lib/set-access";
import { unlockCookieName, verifyUnlockToken } from "@/lib/unlock-token";
import type { SetOwner } from "@/types/sets";

export type ViewerCard = {
  id: string;
  term: string;
  definition: string;
  mastery: Mastery;
  wrongCount: number;
  starred: boolean;
};

export type ViewerSet = {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  owner: SetOwner;
  isOwner: boolean;
  cards: ViewerCard[];
};

export type SetViewResult =
  | { status: "ok"; set: ViewerSet }
  | { status: "needs_password"; set: { id: string; title: string; owner: SetOwner } }
  | { status: "not_found" };

/** Access check shared by pages and actions; reads the password-unlock cookie. */
export async function getSetAccess(setId: string, userId: string) {
  const set = await db.set.findUnique({
    where: { id: setId },
    select: { id: true, ownerId: true, visibility: true },
  });
  if (!set) return { decision: "not_found" as const, set: null };
  if (set.ownerId === userId || set.visibility === "PUBLIC") {
    return { decision: decideSetAccess(set, userId, false), set };
  }
  const sharedViaGroup = await isSharedWithUserGroup(setId, userId);
  let unlocked = false;
  if (!sharedViaGroup && set.visibility === "PASSWORD") {
    const token = (await cookies()).get(unlockCookieName(setId))?.value;
    unlocked = verifyUnlockToken(getAuthSecret(), token, setId, userId);
  }
  return { decision: decideSetAccess(set, userId, unlocked, sharedViaGroup), set };
}

/** Loads a set with the viewer's progress and favorites, if the viewer may see it. */
export const getSetForViewer = cache(
  async (setId: string, userId: string): Promise<SetViewResult> => {
    const { decision } = await getSetAccess(setId, userId);
    if (decision === "not_found") return { status: "not_found" };

    const set = await db.set.findUnique({
      where: { id: setId },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        ownerId: true,
        owner: { select: { name: true, username: true, image: true } },
      },
    });
    if (!set) return { status: "not_found" };
    if (decision === "needs_password") {
      return { status: "needs_password", set: { id: set.id, title: set.title, owner: set.owner } };
    }

    const cards = await db.card.findMany({
      where: { setId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        term: true,
        definition: true,
        progress: { where: { userId }, select: { mastery: true, wrongCount: true } },
        favorites: { where: { userId }, select: { userId: true } },
      },
    });

    return {
      status: "ok",
      set: {
        id: set.id,
        title: set.title,
        description: set.description,
        visibility: set.visibility,
        owner: set.owner,
        isOwner: set.ownerId === userId,
        cards: cards.map((c) => ({
          id: c.id,
          term: c.term,
          definition: c.definition,
          mastery: c.progress[0]?.mastery ?? "NEW",
          wrongCount: c.progress[0]?.wrongCount ?? 0,
          starred: c.favorites.length > 0,
        })),
      },
    };
  },
);
