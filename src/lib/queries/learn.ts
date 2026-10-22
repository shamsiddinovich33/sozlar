import "server-only";

import type { CardProgress, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { applyAnswer, initialProgress, type CardProgressState } from "@/lib/learning";

function toProgressState(row: CardProgress): CardProgressState {
  return {
    cardId: row.cardId,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    streak: row.streak,
    box: row.box,
    weight: row.weight,
    mastery: row.mastery,
    lastSeenAt: row.lastSeenAt,
    nextDueAt: row.nextDueAt,
  };
}

/** All of a user's saved progress for the cards of one set. */
export async function getSetProgress(setId: string, userId: string): Promise<CardProgressState[]> {
  const rows = await db.cardProgress.findMany({ where: { userId, card: { setId } } });
  return rows.map(toProgressState);
}

/**
 * Applies one answer to the stored progress inside a transaction. The row is locked, so two
 * quick answers for the same card can't overwrite each other.
 */
export async function applyAnswerInDb(
  tx: Prisma.TransactionClient,
  userId: string,
  cardId: string,
  isCorrect: boolean,
  now: Date,
): Promise<CardProgressState> {
  await tx.cardProgress.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId },
    update: {},
  });
  const [row] = await tx.$queryRaw<CardProgress[]>`
    SELECT * FROM "CardProgress" WHERE "userId" = ${userId} AND "cardId" = ${cardId} FOR UPDATE`;
  const current = row ? toProgressState(row) : initialProgress(cardId);
  const next = applyAnswer(current, isCorrect, now);
  await tx.cardProgress.update({
    where: { userId_cardId: { userId, cardId } },
    data: {
      correctCount: next.correctCount,
      wrongCount: next.wrongCount,
      streak: next.streak,
      box: next.box,
      weight: next.weight,
      mastery: next.mastery,
      lastSeenAt: next.lastSeenAt,
      nextDueAt: next.nextDueAt,
    },
  });
  return next;
}
