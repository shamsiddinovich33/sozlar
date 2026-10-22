import { addDays, toDayKey, weekdayOf, APP_TIME_ZONE } from "@/lib/dates";

export type SessionActivity = { startedAt: Date; correct: number; wrong: number };

/** Answers per local day ("YYYY-MM-DD" → count); days without answers are omitted. */
export function dailyAnswerTotals(
  sessions: readonly SessionActivity[],
  timeZone: string = APP_TIME_ZONE,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of sessions) {
    const answers = s.correct + s.wrong;
    if (answers <= 0) continue;
    const key = toDayKey(s.startedAt, timeZone);
    totals.set(key, (totals.get(key) ?? 0) + answers);
  }
  return totals;
}

/**
 * Consecutive active days ending today. If today has no activity yet, a streak that ended
 * yesterday still counts (it isn't broken until the day is over).
 */
export function currentStreak(activeDays: ReadonlySet<string>, today: string): number {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (activeDays.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** The last `n` day keys ending with `today`, oldest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

export type HeatmapCell = { day: string; count: number } | null;

/**
 * Week columns (Monday → Sunday) covering the last `weeks` weeks up to the current week.
 * Days after `today` are null so the grid keeps its shape.
 */
export function heatmapWeeks(
  totals: ReadonlyMap<string, number>,
  today: string,
  weeks: number,
): HeatmapCell[][] {
  const currentMonday = addDays(today, -weekdayOf(today));
  const firstMonday = addDays(currentMonday, -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstMonday, w * 7 + d);
      return day > today ? null : { day, count: totals.get(day) ?? 0 };
    }),
  );
}

/** Intensity level 0–4 for a heatmap cell, relative to the busiest day. */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function accuracyPercent(correct: number, wrong: number): number | null {
  const total = correct + wrong;
  return total === 0 ? null : Math.round((correct / total) * 100);
}

export type WordStat = {
  cardId: string;
  term: string;
  definition: string;
  setId: string;
  setTitle: string;
  correctCount: number;
  wrongCount: number;
};

/** Words with the highest error rate (at least `minAttempts` answers), most errors breaking ties. */
export function hardestWords<T extends WordStat>(
  words: readonly T[],
  limit = 10,
  minAttempts = 2,
): (T & { errorRate: number })[] {
  return words
    .filter((w) => w.wrongCount > 0 && w.correctCount + w.wrongCount >= minAttempts)
    .map((w) => ({ ...w, errorRate: w.wrongCount / (w.correctCount + w.wrongCount) }))
    .sort((a, b) => b.errorRate - a.errorRate || b.wrongCount - a.wrongCount)
    .slice(0, limit);
}

/** "2 soat 5 daqiqa" / "12 daqiqa" / "0 daqiqa". */
export function formatStudyTime(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} soat ${minutes} daqiqa` : `${minutes} daqiqa`;
}
