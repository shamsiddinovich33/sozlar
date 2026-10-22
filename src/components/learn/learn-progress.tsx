import type { LearnSession } from "@/lib/learning";

/** Segmented bar: mastered (green), familiar (blue), learning (orange) out of all cards in scope. */
export function LearnProgress({ session }: { session: LearnSession }) {
  const total = session.cardIds.length;
  const count = (predicate: (id: string) => boolean) => session.cardIds.filter(predicate).length;
  const isReview = session.goal === "review";
  const mastered = isReview
    ? count((id) => (session.roundStreak[id] ?? 0) >= 2)
    : count((id) => session.progress[id]?.mastery === "MASTERED");
  const familiar = isReview ? 0 : count((id) => session.progress[id]?.mastery === "FAMILIAR");
  const learning = isReview
    ? count((id) => (session.roundStreak[id] ?? 0) === 1)
    : count((id) => session.progress[id]?.mastery === "LEARNING");
  const pct = (n: number) => `${total === 0 ? 0 : (n / total) * 100}%`;

  return (
    <div className="grid gap-1.5">
      <div
        role="progressbar"
        aria-label="O'zlashtirilgan so'zlar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={mastered}
        aria-valuetext={`${total} tadan ${mastered} tasi ${isReview ? "takrorlandi" : "o'zlashtirildi"}`}
        className="flex h-3 w-full overflow-hidden rounded-full bg-secondary"
      >
        <span
          className="h-full bg-success transition-[width] duration-500"
          style={{ width: pct(mastered) }}
        />
        <span
          className="h-full bg-brand transition-[width] duration-500"
          style={{ width: pct(familiar) }}
        />
        <span
          className="h-full bg-error/80 transition-[width] duration-500"
          style={{ width: pct(learning) }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>0</span>
        <span className="font-semibold text-foreground">
          {mastered} / {total} {isReview ? "takrorlandi" : "o'zlashtirildi"}
        </span>
        <span>{total}</span>
      </div>
    </div>
  );
}
