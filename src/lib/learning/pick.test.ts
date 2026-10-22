import { describe, expect, it } from "vitest";

import { pickNextCard, scoreCard } from "./pick";
import { applyAnswer, initialProgress } from "./progress";
import { ids, makeProgress, seededRng } from "./test-utils";
import type { CardProgressState } from "./types";

const now = new Date("2026-10-22T10:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

function frequencies(pool: CardProgressState[], runs: number, recent: string[] = []) {
  const rng = seededRng(7);
  const counts: Record<string, number> = {};
  for (let i = 0; i < runs; i++) {
    const id = pickNextCard(pool, recent, now, rng)!;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

describe("scoreCard", () => {
  it("follows weight × recency × due, with a bonus for error rate > 40%", () => {
    const base = makeProgress("a", {
      weight: 2,
      lastSeenAt: minutesAgo(5),
      nextDueAt: minutesAgo(1),
    });
    expect(scoreCard(base, now)).toBeCloseTo(2 * 1.5 * 1.5);
    const notDue = { ...base, nextDueAt: new Date(now.getTime() + 60_000) };
    expect(scoreCard(notDue, now)).toBeCloseTo(2 * 1.5 * 0.7);
    const hard = { ...base, correctCount: 1, wrongCount: 1 };
    expect(scoreCard(hard, now)).toBeCloseTo(2 * 1.5 * 1.5 * 1.5);
    const neverSeen = makeProgress("b");
    expect(scoreCard(neverSeen, now)).toBeCloseTo(1 * 3 * 1.5);
  });
});

describe("pickNextCard", () => {
  it("wrong answers increase a card's selection probability", () => {
    const seen = minutesAgo(3);
    const pool = ids(4).map((id) => makeProgress(id, { lastSeenAt: seen, nextDueAt: seen }));
    const before = frequencies(pool, 4000);

    const wrongOnce = applyAnswer(pool[0]!, false, seen);
    const after = frequencies([wrongOnce, ...pool.slice(1)], 4000);

    expect(scoreCard(wrongOnce, now)).toBeGreaterThan(scoreCard(pool[0]!, now));
    expect(after.c1! / 4000).toBeGreaterThan(before.c1! / 4000 + 0.25);
    // Twice wrong is picked even more often.
    const wrongTwice = applyAnswer(wrongOnce, false, seen);
    expect(frequencies([wrongTwice, ...pool.slice(1)], 4000).c1!).toBeGreaterThan(after.c1!);
  });

  it("mastered cards appear rarely", () => {
    let mastered = initialProgress("m");
    for (let i = 0; i < 6; i++) mastered = applyAnswer(mastered, true, minutesAgo(2));
    expect(mastered.mastery).toBe("MASTERED");
    const learning = ids(6).map((id) =>
      applyAnswer(applyAnswer(initialProgress(id), true, minutesAgo(3)), false, minutesAgo(2)),
    );
    const counts = frequencies([mastered, ...learning], 5000);
    expect((counts.m ?? 0) / 5000).toBeLessThan(0.03);
  });

  it("never picks one of the last three shown cards when others are available", () => {
    const pool = ids(5).map((id) => makeProgress(id));
    const rng = seededRng(3);
    for (let i = 0; i < 500; i++) {
      expect(["c1", "c2", "c3"]).not.toContain(pickNextCard(pool, ["c1", "c2", "c3"], now, rng));
    }
  });

  it("falls back to fewer exclusions when the pool is small", () => {
    const pool = ids(2).map((id) => makeProgress(id));
    const rng = seededRng(5);
    for (let i = 0; i < 100; i++) expect(pickNextCard(pool, ["c1", "c2"], now, rng)).toBe("c1");
    expect(pickNextCard([makeProgress("solo")], ["solo"], now, rng)).toBe("solo");
    expect(pickNextCard([], [], now, rng)).toBeNull();
  });
});
