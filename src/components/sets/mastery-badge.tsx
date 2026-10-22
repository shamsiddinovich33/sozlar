import type { Mastery } from "@prisma/client";

import { cn } from "@/lib/utils";

const MASTERY_LABELS: Record<Mastery, string> = {
  NEW: "Yangi",
  LEARNING: "O'rganilmoqda",
  FAMILIAR: "Tanish",
  MASTERED: "O'zlashtirilgan",
};

const STYLES: Record<Mastery, string> = {
  NEW: "bg-secondary text-muted-foreground",
  LEARNING: "bg-error/15 text-error-text",
  FAMILIAR: "bg-brand/15 text-brand-text",
  MASTERED: "bg-success/15 text-success-text",
};

export function MasteryBadge({ mastery }: { mastery: Mastery }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STYLES[mastery],
      )}
    >
      {MASTERY_LABELS[mastery]}
    </span>
  );
}
