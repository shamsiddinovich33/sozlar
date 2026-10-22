"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { UZ_WEEKDAYS_SHORT, formatDayUz, weekdayOf } from "@/lib/dates";

type Point = { day: string; count: number };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-border">
      <p className="text-muted-foreground">{formatDayUz(point.day)}</p>
      <p className="font-semibold">{point.count} ta javob</p>
    </div>
  );
}

/** Answers per day for the last 7 days (single series, so no legend). */
export function WeeklyActivityChart({ data }: { data: Point[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const rows = data.map((d) => ({ ...d, label: UZ_WEEKDAYS_SHORT[weekdayOf(d.day)] }));

  return (
    <figure className="grid gap-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-bold">Haftalik faollik</span>
        <span className="text-sm text-muted-foreground">{total} ta javob</span>
      </figcaption>
      <div aria-hidden className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer={false}
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)", opacity: 0.4 }}
              content={<ChartTooltip />}
              isAnimationActive={false}
            />
            <Bar
              dataKey="count"
              fill="var(--color-brand)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>So&apos;nggi 7 kundagi javoblar soni</caption>
        <thead>
          <tr>
            <th scope="col">Kun</th>
            <th scope="col">Javoblar</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{formatDayUz(d.day)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
