export const APP_TIME_ZONE = "Asia/Tashkent";

export type RecencyBucket = "today" | "thisWeek" | "earlier";

export const RECENCY_LABELS: Record<RecencyBucket, string> = {
  today: "Bugun",
  thisWeek: "Shu hafta",
  earlier: "Oldinroq",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar date of `date` in `timeZone`, as a UTC-midnight timestamp, plus its weekday (0 = Monday). */
function localDay(date: Date, timeZone: string): { dayStart: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const dayStart = Date.UTC(get("year"), get("month") - 1, get("day"));
  const weekday = (new Date(dayStart).getUTCDay() + 6) % 7;
  return { dayStart, weekday };
}

/** Buckets a date relative to `now`: today, earlier this week (weeks start on Monday), or earlier. */
export function getRecencyBucket(
  date: Date,
  now: Date,
  timeZone: string = APP_TIME_ZONE,
): RecencyBucket {
  const today = localDay(now, timeZone);
  const target = localDay(date, timeZone);
  const daysAgo = Math.round((today.dayStart - target.dayStart) / DAY_MS);
  if (daysAgo <= 0) return "today";
  if (daysAgo <= today.weekday) return "thisWeek";
  return "earlier";
}

/** Groups items into recency buckets, keeping input order and dropping empty groups. */
export function groupByRecency<T>(
  items: readonly T[],
  getDate: (item: T) => Date,
  now: Date,
  timeZone: string = APP_TIME_ZONE,
): { bucket: RecencyBucket; label: string; items: T[] }[] {
  const groups: Record<RecencyBucket, T[]> = { today: [], thisWeek: [], earlier: [] };
  for (const item of items) groups[getRecencyBucket(getDate(item), now, timeZone)].push(item);
  return (Object.keys(groups) as RecencyBucket[])
    .filter((bucket) => groups[bucket].length > 0)
    .map((bucket) => ({ bucket, label: RECENCY_LABELS[bucket], items: groups[bucket] }));
}
