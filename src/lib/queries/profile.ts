import "server-only";

import type { Prisma } from "@prisma/client";
import { Mastery } from "@prisma/client";

import { addDays, toDayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { setVisibleTo } from "@/lib/queries/visibility";
import {
  accuracyPercent,
  currentStreak,
  dailyAnswerTotals,
  hardestWords,
  heatmapWeeks,
  lastDays,
  type HeatmapCell,
  type WordStat,
} from "@/lib/stats";

const HEATMAP_WEEKS = 26;
/** Longest a single study session counts toward study time (idle tabs don't inflate it). */
const SESSION_CAP_SECONDS = 3 * 60 * 60;

export type ProfileStats = {
  totalSets: number;
  totalWords: number;
  masteredWords: number;
  streak: number;
  accuracy: number | null;
  studyMs: number;
  weekly: { day: string; count: number }[];
  heatmap: HeatmapCell[][];
  activeDays: number;
  hardest: (WordStat & { errorRate: number })[];
};

/** Progress only counts for cards in sets the user can still see. */
function visibleCard(userId: string): Prisma.CardWhereInput {
  return { set: setVisibleTo(userId) };
}

export async function getProfileStats(userId: string, now = new Date()): Promise<ProfileStats> {
  const today = toDayKey(now);
  // Enough history for the heatmap and a long streak.
  const since = new Date(Date.parse(`${addDays(today, -400)}T00:00:00Z`));

  const [totalSets, totalWords, masteredWords, answers, sessions, studySeconds, words] =
    await Promise.all([
      db.set.count({ where: { ownerId: userId } }),
      db.card.count({ where: { set: { ownerId: userId } } }),
      db.cardProgress.count({
        where: { userId, mastery: Mastery.MASTERED, card: visibleCard(userId) },
      }),
      db.cardProgress.aggregate({
        where: { userId },
        _sum: { correctCount: true, wrongCount: true },
      }),
      db.studySession.findMany({
        where: { userId, startedAt: { gte: since } },
        select: { startedAt: true, correct: true, wrong: true },
      }),
      db.$queryRaw<{ seconds: number | null }[]>`
        SELECT SUM(LEAST(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")), ${SESSION_CAP_SECONDS}))::float AS seconds
        FROM "StudySession"
        WHERE "userId" = ${userId} AND "endedAt" IS NOT NULL AND "endedAt" > "startedAt"`,
      db.cardProgress.findMany({
        where: { userId, wrongCount: { gt: 0 }, card: visibleCard(userId) },
        orderBy: { wrongCount: "desc" },
        take: 500,
        select: {
          correctCount: true,
          wrongCount: true,
          card: {
            select: {
              id: true,
              term: true,
              definition: true,
              set: { select: { id: true, title: true } },
            },
          },
        },
      }),
    ]);

  const totals = dailyAnswerTotals(sessions);
  const activeDays = new Set(totals.keys());

  return {
    totalSets,
    totalWords,
    masteredWords,
    streak: currentStreak(activeDays, today),
    accuracy: accuracyPercent(answers._sum.correctCount ?? 0, answers._sum.wrongCount ?? 0),
    studyMs: (studySeconds[0]?.seconds ?? 0) * 1000,
    weekly: lastDays(today, 7).map((day) => ({ day, count: totals.get(day) ?? 0 })),
    heatmap: heatmapWeeks(totals, today, HEATMAP_WEEKS),
    activeDays: [...activeDays].filter((d) => d >= addDays(today, -7 * HEATMAP_WEEKS)).length,
    hardest: hardestWords(
      words.map((w) => ({
        cardId: w.card.id,
        term: w.card.term,
        definition: w.card.definition,
        setId: w.card.set.id,
        setTitle: w.card.set.title,
        correctCount: w.correctCount,
        wrongCount: w.wrongCount,
      })),
    ),
  };
}

export async function getProfileAccount(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
      image: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  });
  if (!user) return null;
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    image: user.image,
    hasPassword: user.passwordHash !== null,
    providers: user.accounts.map((a) => a.provider),
  };
}
