"use server";

import { cookies } from "next/headers";

import { ACTION_ERRORS, ActionError, requireUserId, runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getOwnedSetOrThrow } from "@/lib/queries/owned-set";
import { getSetAccess } from "@/lib/queries/set-view";
import { setUnlockLimiter } from "@/lib/rate-limit";
import { getAuthSecret } from "@/lib/secret";
import { UNLOCK_TTL_MS, signUnlockToken, unlockCookieName } from "@/lib/unlock-token";
import {
  favoriteSchema,
  finishSessionSchema,
  setIdSchema,
  studyModeSchema,
  unlockSetSchema,
} from "@/lib/validators/set";
import type { ActionResult } from "@/types/actions";

/** Throws unless the user may view (and therefore study) the set. */
async function assertCanView(setId: string, userId: string): Promise<void> {
  const { decision } = await getSetAccess(setId, userId);
  if (decision !== "allow") throw new ActionError(ACTION_ERRORS.notFound);
}

/** Checks a set password and stores a signed, user-bound unlock cookie. */
export async function unlockSet(setId: unknown, input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    const { password } = unlockSetSchema.parse(input);

    const { success } = await setUnlockLimiter.limit(`${userId}:${id}`);
    if (!success) throw new ActionError("Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring");

    const set = await db.set.findUnique({
      where: { id },
      select: { visibility: true, passwordHash: true },
    });
    if (!set || set.visibility !== "PASSWORD" || !set.passwordHash) {
      throw new ActionError(ACTION_ERRORS.notFound);
    }
    if (!(await verifyPassword(password, set.passwordHash))) {
      throw new ActionError("Parol noto'g'ri");
    }

    (await cookies()).set(unlockCookieName(id), signUnlockToken(getAuthSecret(), id, userId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: UNLOCK_TTL_MS / 1000,
    });
    return null;
  });
}

/** Deletes a set (owner only). Cards, progress and sessions cascade. */
export async function deleteSet(setId: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    await getOwnedSetOrThrow(id, userId, { id: true });
    await db.set.delete({ where: { id } });
    return null;
  });
}

/** Clears the current user's learning progress for one set. */
export async function resetProgress(setId: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    await assertCanView(id, userId);
    await db.cardProgress.deleteMany({ where: { userId, card: { setId: id } } });
    return null;
  });
}

export async function toggleFavorite(input: unknown): Promise<ActionResult<{ starred: boolean }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { cardId, starred } = favoriteSchema.parse(input);
    const card = await db.card.findUnique({ where: { id: cardId }, select: { setId: true } });
    if (!card) throw new ActionError(ACTION_ERRORS.notFound);
    await assertCanView(card.setId, userId);

    if (starred) {
      await db.favorite.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId },
        update: {},
      });
    } else {
      await db.favorite.deleteMany({ where: { userId, cardId } });
    }
    return { starred };
  });
}

export async function startStudySession(
  setId: unknown,
  mode: unknown,
): Promise<ActionResult<{ sessionId: string }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    const studyMode = studyModeSchema.parse(mode);
    await assertCanView(id, userId);
    const session = await db.studySession.create({
      data: { userId, setId: id, mode: studyMode },
      select: { id: true },
    });
    return { sessionId: session.id };
  });
}

export async function finishStudySession(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { sessionId, correct, wrong } = finishSessionSchema.parse(input);
    const { count } = await db.studySession.updateMany({
      where: { id: sessionId, userId },
      data: { correct, wrong, endedAt: new Date() },
    });
    if (count === 0) throw new ActionError(ACTION_ERRORS.notFound);
    return null;
  });
}
