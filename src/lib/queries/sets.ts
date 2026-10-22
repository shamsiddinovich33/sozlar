import "server-only";

import type { Prisma } from "@prisma/client";
import { Mastery, Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { masteryPercent } from "@/lib/progress";
import type { LibrarySearch } from "@/lib/validators/library";
import type { ContinueSet, SetSummary } from "@/types/sets";

const summarySelect = {
  id: true,
  title: true,
  visibility: true,
  ownerId: true,
  updatedAt: true,
  owner: { select: { name: true, username: true, image: true } },
  _count: { select: { cards: true } },
} satisfies Prisma.SetSelect;

type SummaryRow = Prisma.SetGetPayload<{ select: typeof summarySelect }>;

function toSummary(row: SummaryRow, userId: string, lastStudiedAt?: Date): SetSummary {
  const isOwner = row.ownerId === userId;
  const candidates = [lastStudiedAt, isOwner ? row.updatedAt : undefined].filter(
    (d): d is Date => d instanceof Date,
  );
  return {
    id: row.id,
    title: row.title,
    visibility: row.visibility,
    cardCount: row._count.cards,
    owner: row.owner,
    isOwner,
    activityAt: new Date(Math.max(...candidates.map((d) => d.getTime()), 0)),
  };
}

/** Sets the user may currently see: their own, or anyone's non-private set. */
function visibleTo(userId: string): Prisma.SetWhereInput {
  return { OR: [{ ownerId: userId }, { visibility: { not: Visibility.PRIVATE } }] };
}

/** Most recent study time per set for this user, newest first. */
async function getLastStudied(userId: string, take: number): Promise<Map<string, Date>> {
  const rows = await db.studySession.groupBy({
    by: ["setId"],
    where: { userId },
    _max: { startedAt: true },
    orderBy: { _max: { startedAt: "desc" } },
    take,
  });
  const map = new Map<string, Date>();
  for (const row of rows) if (row._max.startedAt) map.set(row.setId, row._max.startedAt);
  return map;
}

/** Recently studied sets with the share of cards the user has mastered. */
export async function getContinueSets(userId: string, take = 8): Promise<ContinueSet[]> {
  const lastStudied = await getLastStudied(userId, take);
  const ids = [...lastStudied.keys()];
  if (ids.length === 0) return [];

  const [rows, masteredRows] = await Promise.all([
    db.set.findMany({ where: { id: { in: ids }, ...visibleTo(userId) }, select: summarySelect }),
    db.card.groupBy({
      by: ["setId"],
      where: { setId: { in: ids }, progress: { some: { userId, mastery: Mastery.MASTERED } } },
      _count: { _all: true },
    }),
  ]);
  const mastered = new Map(masteredRows.map((r) => [r.setId, r._count._all]));

  return rows
    .map((row) => {
      const summary = toSummary(row, userId, lastStudied.get(row.id));
      const masteredCount = mastered.get(row.id) ?? 0;
      return {
        ...summary,
        masteredCount,
        masteredPercent: masteryPercent(masteredCount, summary.cardCount),
      };
    })
    .sort((a, b) => b.activityAt.getTime() - a.activityAt.getTime());
}

/** The user's own sets and sets they studied, by most recent activity. */
export async function getRecentSets(userId: string, take = 10): Promise<SetSummary[]> {
  const lastStudied = await getLastStudied(userId, take);
  const rows = await db.set.findMany({
    where: {
      OR: [{ ownerId: userId }, { id: { in: [...lastStudied.keys()] }, ...visibleTo(userId) }],
    },
    select: summarySelect,
    orderBy: { updatedAt: "desc" },
    take: take * 2,
  });

  return rows
    .map((row) => toSummary(row, userId, lastStudied.get(row.id)))
    .sort((a, b) => b.activityAt.getTime() - a.activityAt.getTime())
    .slice(0, take);
}

/** The user's own sets, optionally filtered by title and sorted. */
export async function getLibrarySets(userId: string, search: LibrarySearch): Promise<SetSummary[]> {
  const rows = await db.set.findMany({
    where: {
      ownerId: userId,
      ...(search.q && { title: { contains: search.q, mode: "insensitive" } }),
    },
    select: summarySelect,
    orderBy: search.sort === "az" ? { title: "asc" } : { updatedAt: "desc" },
    take: 200,
  });
  return rows.map((row) => toSummary(row, userId));
}
