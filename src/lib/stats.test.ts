import { describe, expect, it } from "vitest";

import { addDays, toDayKey, weekdayOf } from "./dates";
import {
  accuracyPercent,
  currentStreak,
  dailyAnswerTotals,
  formatStudyTime,
  hardestWords,
  heatLevel,
  heatmapWeeks,
  lastDays,
} from "./stats";

describe("day keys", () => {
  it("uses Tashkent local days", () => {
    expect(toDayKey(new Date("2026-10-21T18:30:00Z"))).toBe("2026-10-21"); // 23:30 local
    expect(toDayKey(new Date("2026-10-21T19:30:00Z"))).toBe("2026-10-22"); // 00:30 local
  });

  it("shifts across months and knows weekdays", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(weekdayOf("2026-10-19")).toBe(0); // Monday
    expect(weekdayOf("2026-10-25")).toBe(6); // Sunday
  });
});

describe("dailyAnswerTotals", () => {
  it("sums answers per local day and skips empty sessions", () => {
    const totals = dailyAnswerTotals([
      { startedAt: new Date("2026-10-21T05:00:00Z"), correct: 5, wrong: 2 },
      { startedAt: new Date("2026-10-21T15:00:00Z"), correct: 3, wrong: 0 },
      { startedAt: new Date("2026-10-21T20:00:00Z"), correct: 1, wrong: 1 }, // next local day
      { startedAt: new Date("2026-10-20T05:00:00Z"), correct: 0, wrong: 0 },
    ]);
    expect([...totals]).toEqual([
      ["2026-10-21", 10],
      ["2026-10-22", 2],
    ]);
  });
});

describe("currentStreak", () => {
  const days = new Set(["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"]);
  it("counts consecutive days ending today", () => {
    expect(currentStreak(days, "2026-10-21")).toBe(4);
  });
  it("still counts a streak that ended yesterday", () => {
    expect(currentStreak(days, "2026-10-22")).toBe(4);
  });
  it("is broken after a missed day", () => {
    expect(currentStreak(days, "2026-10-23")).toBe(0);
    expect(currentStreak(new Set(), "2026-10-23")).toBe(0);
  });
});

describe("heatmap", () => {
  it("builds Monday-first week columns ending with the current week", () => {
    const weeks = heatmapWeeks(new Map([["2026-10-21", 7]]), "2026-10-21", 3);
    expect(weeks).toHaveLength(3);
    expect(weeks[0]?.[0]?.day).toBe("2026-10-05");
    const last = weeks[2]!;
    expect(last[0]?.day).toBe("2026-10-19");
    expect(last[2]).toEqual({ day: "2026-10-21", count: 7 });
    expect(last.slice(3)).toEqual([null, null, null, null]);
  });

  it("maps counts to 5 levels", () => {
    expect([0, 1, 30, 60, 100].map((c) => heatLevel(c, 100))).toEqual([0, 1, 2, 3, 4]);
    expect(heatLevel(5, 0)).toBe(0);
  });

  it("lists the last n days", () => {
    expect(lastDays("2026-10-02", 3)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
  });
});

describe("hardestWords", () => {
  const base = { definition: "d", setId: "s", setTitle: "S" };
  it("ranks by error rate, ignores single attempts and never-wrong words", () => {
    const result = hardestWords([
      { ...base, cardId: "a", term: "a", correctCount: 1, wrongCount: 1 },
      { ...base, cardId: "b", term: "b", correctCount: 0, wrongCount: 1 },
      { ...base, cardId: "c", term: "c", correctCount: 1, wrongCount: 3 },
      { ...base, cardId: "d", term: "d", correctCount: 5, wrongCount: 0 },
      { ...base, cardId: "e", term: "e", correctCount: 2, wrongCount: 2 },
    ]);
    expect(result.map((w) => w.cardId)).toEqual(["c", "e", "a"]);
    expect(result[0]?.errorRate).toBe(0.75);
  });
});

describe("formatting", () => {
  it("formats accuracy and study time", () => {
    expect(accuracyPercent(0, 0)).toBeNull();
    expect(accuracyPercent(2, 1)).toBe(67);
    expect(formatStudyTime(125 * 60_000)).toBe("2 soat 5 daqiqa");
    expect(formatStudyTime(59_000)).toBe("0 daqiqa");
  });
});

describe("Uzbek date labels", async () => {
  const { formatDayUz, shortMonthUz } = await import("./dates");
  it("formats day keys", () => {
    expect(formatDayUz("2026-10-02")).toBe("2-oktabr");
    expect(shortMonthUz("2026-01-15")).toBe("yan");
    expect(shortMonthUz("2026-06-01")).not.toBe(shortMonthUz("2026-07-01"));
  });
});
