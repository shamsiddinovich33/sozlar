"use client";

import { useEffect, useRef, useState } from "react";

import { UZ_WEEKDAYS_SHORT, formatDayUz, shortMonthUz } from "@/lib/dates";
import { heatLevel, type HeatmapCell } from "@/lib/stats";
import { cn } from "@/lib/utils";

const LEVEL_CLASS = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"] as const;
const CELL = 12;
const GAP = 3;

type HoverState = { day: string; count: number; x: number; y: number; alignEnd: boolean } | null;

/** GitHub-style activity grid: one column per week (Monday on top), one hue light → dark. */
export function StreakHeatmap({
  weeks,
  streak,
  activeDays,
}: {
  weeks: HeatmapCell[][];
  streak: number;
  activeDays: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState>(null);
  const cells = weeks.flat().filter((c): c is NonNullable<HeatmapCell> => c !== null);
  const max = Math.max(0, ...cells.map((c) => c.count));
  const active = cells.filter((c) => c.count > 0);

  // Show the most recent weeks first on narrow screens.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // Label a column where a new month starts; skip a label that would collide with the next one.
  const months = weeks.map((week) => (week[0] ? shortMonthUz(week[0].day) : ""));
  const starts = months.flatMap((m, i) => (i === 0 || m !== months[i - 1] ? [i] : []));
  const monthLabels = months.map((m, i) => {
    const at = starts.indexOf(i);
    if (at === -1) return "";
    const next = starts[at + 1] ?? weeks.length;
    return next - i >= 3 ? m : "";
  });

  return (
    <figure className="grid gap-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-bold">Faollik xaritasi</span>
        <span className="text-sm text-muted-foreground">
          {activeDays} faol kun · seriya {streak} kun
        </span>
      </figcaption>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Faollik xaritasi (gorizontal aylantiriladi)"
        className="relative overflow-x-auto rounded-md pb-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <div
          role="img"
          aria-label={`So'nggi ${weeks.length} hafta: ${activeDays} kun faol bo'lgansiz, joriy seriya ${streak} kun`}
          className="inline-grid gap-y-1"
          style={{
            gridTemplateColumns: `1.75rem repeat(${weeks.length}, ${CELL}px)`,
            columnGap: GAP,
          }}
          onMouseLeave={() => setHover(null)}
        >
          <span />
          {monthLabels.map((label, i) => (
            <span
              key={i}
              aria-hidden
              className="text-[10px] leading-3 whitespace-nowrap text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="contents">
              <span aria-hidden className="text-[10px] leading-3 text-muted-foreground">
                {row % 2 === 0 ? UZ_WEEKDAYS_SHORT[row] : ""}
              </span>
              {weeks.map((week, col) => {
                const cell = week[row];
                if (!cell) return <span key={col} style={{ width: CELL, height: CELL }} />;
                return (
                  <span
                    key={col}
                    aria-hidden
                    onMouseEnter={(e) => {
                      const box = e.currentTarget.getBoundingClientRect();
                      const parent = scrollerRef.current?.getBoundingClientRect();
                      const nearRightEdge = parent ? parent.right - box.right < 110 : false;
                      setHover({
                        alignEnd: nearRightEdge,
                        day: cell.day,
                        count: cell.count,
                        x:
                          box.left -
                          (parent?.left ?? 0) +
                          (scrollerRef.current?.scrollLeft ?? 0) +
                          CELL / 2,
                        y: box.top - (parent?.top ?? 0),
                      });
                    }}
                    className={cn(
                      "rounded-[3px] transition-transform hover:scale-125",
                      LEVEL_CLASS[heatLevel(cell.count, max)],
                    )}
                    style={{ width: CELL, height: CELL }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {hover && (
          <div
            role="presentation"
            className={cn(
              "pointer-events-none absolute z-10 -translate-y-full",
              hover.alignEnd ? "-translate-x-full" : "-translate-x-1/2",
              "rounded-lg bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-lg ring-1 ring-border",
            )}
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <span className="font-semibold">{hover.count} ta javob</span> · {formatDayUz(hover.day)}
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground"
      >
        Kam
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={cn("size-3 rounded-[3px]", cls)} />
        ))}
        Ko&apos;p
      </div>

      <table className="sr-only">
        <caption>Faol kunlar va javoblar soni</caption>
        <tbody>
          {active.map((c) => (
            <tr key={c.day}>
              <td>{formatDayUz(c.day)}</td>
              <td>{c.count} ta javob</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
