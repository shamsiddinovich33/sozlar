import { describe, expect, it } from "vitest";

import { BOX_INTERVALS_MS, applyAnswer, initialProgress, masteryFor } from "./progress";

const now = new Date("2026-10-22T10:00:00Z");

describe("initialProgress", () => {
  it("starts at box 0, weight 1, NEW", () => {
    expect(initialProgress("a")).toMatchObject({ box: 0, weight: 1, mastery: "NEW", streak: 0 });
  });
});

describe("applyAnswer", () => {
  it("correct: streak +1, weight × 0.6 (min 0.2), box only moves from the 2nd correct in a row", () => {
    const first = applyAnswer(initialProgress("a"), true, now);
    expect(first).toMatchObject({ streak: 1, box: 0, correctCount: 1 });
    expect(first.weight).toBeCloseTo(0.6);
    const second = applyAnswer(first, true, now);
    expect(second).toMatchObject({ streak: 2, box: 1 });
    expect(second.weight).toBeCloseTo(0.36);
    const third = applyAnswer(second, true, now);
    expect(third.weight).toBeCloseTo(0.216);
    expect(applyAnswer(third, true, now).weight).toBe(0.2);
  });

  it("wrong: streak 0, box −1 (min 0), weight × 2 + 0.5 (max 8), wrongCount +1", () => {
    const p = { ...initialProgress("a"), box: 3, streak: 4, weight: 1 };
    const wrong = applyAnswer(p, false, now);
    expect(wrong).toMatchObject({ streak: 0, box: 2, weight: 2.5, wrongCount: 1 });
    expect(applyAnswer(initialProgress("a"), false, now).box).toBe(0);
    expect(applyAnswer({ ...p, weight: 5 }, false, now).weight).toBe(8);
  });

  it("box never exceeds 4", () => {
    let p = initialProgress("a");
    for (let i = 0; i < 20; i++) p = applyAnswer(p, true, now);
    expect(p.box).toBe(4);
  });

  it("sets lastSeenAt and nextDueAt from the box interval", () => {
    const p = applyAnswer({ ...initialProgress("a"), box: 2, streak: 1 }, true, now);
    expect(p.lastSeenAt).toEqual(now);
    expect(p.nextDueAt?.getTime()).toBe(now.getTime() + BOX_INTERVALS_MS[3]!);
  });

  it("needs five correct answers in a row to master a new card", () => {
    let p = initialProgress("a");
    const levels = [];
    for (let i = 0; i < 5; i++) {
      p = applyAnswer(p, true, now);
      levels.push(p.mastery);
    }
    expect(levels).toEqual(["NEW", "LEARNING", "LEARNING", "FAMILIAR", "MASTERED"]);
  });
});

describe("masteryFor", () => {
  it("maps boxes to mastery levels", () => {
    expect(masteryFor({ box: 0, streak: 0, wrongCount: 0 })).toBe("NEW");
    expect(masteryFor({ box: 0, streak: 0, wrongCount: 1 })).toBe("LEARNING");
    expect(masteryFor({ box: 1, streak: 0, wrongCount: 0 })).toBe("LEARNING");
    expect(masteryFor({ box: 2, streak: 0, wrongCount: 0 })).toBe("LEARNING");
    expect(masteryFor({ box: 3, streak: 0, wrongCount: 0 })).toBe("FAMILIAR");
    expect(masteryFor({ box: 4, streak: 2, wrongCount: 0 })).toBe("FAMILIAR");
    expect(masteryFor({ box: 4, streak: 3, wrongCount: 0 })).toBe("MASTERED");
  });
});
