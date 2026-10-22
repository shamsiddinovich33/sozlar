import { BookOpenText, Clock, Flame, Layers, Target, Trophy, type LucideIcon } from "lucide-react";

import type { ProfileStats } from "@/lib/queries/profile";
import { formatStudyTime } from "@/lib/stats";

export function StatTiles({ stats }: { stats: ProfileStats }) {
  const tiles: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "To'plamlar", value: String(stats.totalSets), icon: Layers },
    { label: "So'zlar", value: String(stats.totalWords), icon: BookOpenText },
    { label: "O'zlashtirilgan so'zlar", value: String(stats.masteredWords), icon: Trophy },
    { label: "Joriy seriya", value: `${stats.streak} kun`, icon: Flame },
    { label: "Aniqlik", value: stats.accuracy === null ? "—" : `${stats.accuracy}%`, icon: Target },
    { label: "O'qish vaqti", value: formatStudyTime(stats.studyMs), icon: Clock },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {tiles.map(({ label, value, icon: Icon }) => (
        <div key={label} className="grid gap-2 rounded-xl bg-card p-4 shadow-sm">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </dt>
          <dd className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
