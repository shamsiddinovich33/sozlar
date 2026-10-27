import { cardCredit, type LearnSession } from "@/lib/learning";
import { cn } from "@/lib/utils";

const MAX_SEGMENTS = 6;

/**
 * Quizlet-style progress: the track is split into segments that fill with green as words are
 * mastered (or finished in a review round); a bubble shows the current count, the circle at
 * the end the total.
 */
export function LearnProgress({ session }: { session: LearnSession }) {
  const total = session.cardIds.length;
  const isReview = session.goal === "review";
  const done = session.cardIds.filter((id) =>
    isReview ? (session.roundStreak[id] ?? 0) >= 2 : session.progress[id]?.mastery === "MASTERED",
  ).length;
  // Partial credit so the bar moves with every correct answer, not only when a word is mastered
  const credit = isReview
    ? done
    : session.cardIds.reduce((sum, id) => sum + cardCredit(session.progress[id]), 0);
  const fraction = total === 0 ? 0 : done / total;
  const partial = total === 0 ? 0 : Math.max(fraction, credit / total);
  const segments = Math.max(1, Math.min(MAX_SEGMENTS, total));
  const label = isReview ? "takrorlandi" : "o'zlashtirildi";

  return (
    <div
      role="progressbar"
      aria-label={isReview ? "Takrorlangan so'zlar" : "O'zlashtirilgan so'zlar"}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${total} tadan ${done} tasi ${label}`}
      className="flex items-center gap-3"
    >
      <div className="relative flex flex-1 items-center gap-1.5">
        {Array.from({ length: segments }, (_, i) => {
          const fill = Math.min(1, Math.max(0, fraction * segments - i));
          const soft = Math.min(1, Math.max(0, partial * segments - i));
          return (
            <span key={i} className="relative h-3 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-success/55 transition-[width] duration-500"
                style={{ width: `${soft * 100}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-500"
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          );
        })}
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold tabular-nums shadow-md transition-[left] duration-500",
            done > 0
              ? "bg-success text-navy"
              : partial > 0
                ? "bg-muted text-foreground ring-2 ring-success"
                : "bg-muted text-foreground ring-2 ring-border",
          )}
          style={{ left: `clamp(1rem, ${partial * 100}%, calc(100% - 1rem))` }}
        >
          {done}
        </span>
      </div>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-foreground tabular-nums ring-2 ring-border"
        title={`Jami ${total} ta so'z`}
      >
        {total}
      </span>
    </div>
  );
}
