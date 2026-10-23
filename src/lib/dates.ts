export const APP_TIME_ZONE = "Asia/Tashkent";

export type RecencyBucket = "today" | "thisWeek" | "earlier";

const RECENCY_LABELS: Record<RecencyBucket, string> = {
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

/** Calendar day of `date` in `timeZone` as "YYYY-MM-DD". */
export function toDayKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  return new Date(localDay(date, timeZone).dayStart).toISOString().slice(0, 10);
}

/** Shifts a "YYYY-MM-DD" day key by `days` (may be negative). */
export function addDays(dayKey: string, days: number): string {
  const t = Date.parse(`${dayKey}T00:00:00Z`) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** Weekday of a day key, 0 = Monday … 6 = Sunday. */
export function weekdayOf(dayKey: string): number {
  return (new Date(`${dayKey}T00:00:00Z`).getUTCDay() + 6) % 7;
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

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;
export const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"] as const;

/** "22-oktabr" for a "YYYY-MM-DD" day key. */
export function formatDayUz(dayKey: string): string {
  const [, month, day] = dayKey.split("-").map(Number);
  return `${day}-${UZ_MONTHS[(month ?? 1) - 1]}`;
}

const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
] as const;

/** Short month name ("okt") for heatmap labels; June and July stay distinct (iyn / iyl). */
export function shortMonthUz(dayKey: string): string {
  return UZ_MONTHS_SHORT[Number(dayKey.slice(5, 7)) - 1] ?? "";
}

/** "hozirgina", "5 daqiqa oldin", "3 soat oldin", "kecha", "4 kun oldin", or a date for older ones. */
export function formatRelativeUz(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.round(
    (Date.parse(toDayKey(now)) - Date.parse(toDayKey(date))) / (24 * 60 * 60 * 1000),
  );
  if (days <= 1) return "kecha";
  if (days < 7) return `${days} kun oldin`;
  return formatDayUz(toDayKey(date));
}
