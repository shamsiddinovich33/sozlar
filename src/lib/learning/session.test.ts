import { describe, expect, it } from "vitest";

import { applyAnswer, initialProgress } from "./progress";
import {
  BATCH_SIZE,
  REQUEUE_MAX,
  REQUEUE_MIN,
  cardCredit,
  createSession,
  hardCardIds,
  hardestCardIds,
  isSessionComplete,
  nextCardId,
  progressPercent,
  recordAnswer,
  sessionPercent,
  type LearnSession,
} from "./session";
import { ids, seededRng } from "./test-utils";

const start = new Date("2026-10-22T10:00:00Z").getTime();

describe("progress credit", () => {
  const now = new Date(start);
  it("grows with every correct answer before a word is mastered", () => {
    let p = initialProgress("c1");
    const credits = [cardCredit(p)];
    for (let i = 0; i < 5; i++) {
      p = applyAnswer(p, true, now);
      credits.push(cardCredit(p));
    }
    for (let i = 1; i < credits.length; i++) expect(credits[i]).toBeGreaterThan(credits[i - 1]!);
    expect(credits.at(-1)).toBe(1);
    expect(cardCredit(undefined)).toBe(0);
  });

  it("counts mastered words fully and others partially", () => {
    const mastered = { box: 4, streak: 3, mastery: "MASTERED" as const };
    const fresh = { box: 0, streak: 0, mastery: "NEW" as const };
    expect(progressPercent([mastered, fresh])).toBe(50);
    expect(progressPercent([mastered, undefined, undefined, undefined])).toBe(25);
    expect(progressPercent([])).toBe(0);
  });

  it("is above zero in a mastery session after a few correct answers", () => {
    let session = createSession(ids(10), [], "mastery");
    for (const id of ["c1", "c2", "c3"]) session = recordAnswer(session, id, true, now);
    expect(sessionPercent(session)).toBeGreaterThan(0);
  });
});

/** Simulates a learner; returns the sequence of asked card ids and the final session. */
function simulate(
  session: LearnSession,
  answer: (cardId: string, step: number) => boolean,
  maxQuestions = 5000,
  seed = 1,
) {
  const rng = seededRng(seed);
  const asked: { cardId: string; correct: boolean; activeCount: number }[] = [];
  let s = session;
  for (let step = 0; step < maxQuestions; step++) {
    const now = new Date(start + step * 8_000); // one question every 8 seconds
    const cardId = nextCardId(s, now, rng);
    if (!cardId) break;
    const correct = answer(cardId, step);
    s = recordAnswer(s, cardId, correct, now, rng);
    asked.push({ cardId, correct, activeCount: s.activeIds.length });
  }
  return { asked, session: s };
}

describe("batch introduction", () => {
  it("introduces new cards in batches of 7, never all at once", () => {
    const session = createSession(ids(30), []);
    expect(session.activeIds).toEqual(ids(30).slice(0, BATCH_SIZE));

    const rng = seededRng(11);
    const { asked } = simulate(session, () => rng() < 0.8);
    const sizes = [...new Set(asked.map((a) => a.activeCount))];
    expect(sizes[0]).toBe(BATCH_SIZE);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]! - sizes[i - 1]!).toBeGreaterThan(0);
      expect(sizes[i]! - sizes[i - 1]!).toBeLessThanOrEqual(BATCH_SIZE);
    }
    expect(sizes[sizes.length - 1]).toBe(30);
  });

  it("does not add a batch while the current cards are still unlearned", () => {
    const session = createSession(ids(20), []);
    // Answer every question wrong: the batch never settles.
    const { asked } = simulate(session, () => false, 200);
    expect(asked.every((a) => a.activeCount === BATCH_SIZE)).toBe(true);
  });

  it("only asks about introduced cards", () => {
    const { asked } = simulate(createSession(ids(20), []), () => true, 30);
    const firstBatch = new Set(ids(20).slice(0, BATCH_SIZE));
    expect(asked.slice(0, 10).every((a) => firstBatch.has(a.cardId))).toBe(true);
  });

  it("resumes with previously studied cards active", () => {
    const now = new Date(start);
    const studied = ids(12).map((id) => applyAnswer(initialProgress(id), true, now));
    const session = createSession(ids(30), studied);
    expect(session.activeIds.length).toBe(12);
  });
});

describe("question order", () => {
  it("never repeats a card immediately (pool ≥ 2)", () => {
    const rng = seededRng(21);
    const { asked } = simulate(createSession(ids(12), []), () => rng() < 0.7, 1500);
    for (let i = 1; i < asked.length; i++) {
      expect(asked[i]!.cardId).not.toBe(asked[i - 1]!.cardId);
    }
  });

  it("brings a wrong card back within 3–5 questions", () => {
    const rng = seededRng(33);
    const { asked } = simulate(createSession(ids(15), []), () => rng() < 0.65, 1500);
    let checked = 0;
    asked.forEach((a, i) => {
      if (a.correct) return;
      const next = asked.findIndex((b, j) => j > i && b.cardId === a.cardId);
      if (next === -1) return; // session ended
      const gap = next - i;
      expect(gap).toBeGreaterThanOrEqual(REQUEUE_MIN);
      expect(gap).toBeLessThanOrEqual(REQUEUE_MAX);
      checked++;
    });
    expect(checked).toBeGreaterThan(50);
  });

  it("shows mastered cards rarely while others are still being learned", () => {
    const rng = seededRng(44);
    const { asked, session } = simulate(
      createSession(ids(14), []),
      (id) => {
        // c1–c4 are easy, the rest are hard.
        const easy = ["c1", "c2", "c3", "c4"].includes(id);
        return easy ? true : rng() < 0.55;
      },
      600,
    );
    // Count how often a card was asked after it became mastered, while some cards were not.
    let replay = initialSession(session);
    let masteredAsks = 0;
    let total = 0;
    for (const a of asked) {
      const wasMastered = replay.progress[a.cardId]?.mastery === "MASTERED";
      const someNotMastered = replay.cardIds.some(
        (id) => replay.progress[id]?.mastery !== "MASTERED",
      );
      if (someNotMastered && replay.questionNumber > 100) {
        total++;
        if (wasMastered) masteredAsks++;
      }
      replay = recordAnswer(replay, a.cardId, a.correct, new Date(start), () => 0.5);
    }
    expect(total).toBeGreaterThan(100);
    expect(masteredAsks / total).toBeLessThan(0.12);
  });
});

function initialSession(s: LearnSession): LearnSession {
  return createSession(s.cardIds, []);
}

describe("session completion", () => {
  it("ends when every card is mastered", () => {
    const { session, asked } = simulate(createSession(ids(20), []), () => true);
    expect(isSessionComplete(session)).toBe(true);
    expect(sessionPercent(session)).toBe(100);
    expect(nextCardId(session, new Date(start))).toBeNull();
    // Each card needs at least five correct answers.
    expect(asked.length).toBeGreaterThanOrEqual(100);
  });

  it("an imperfect learner still finishes", () => {
    const rng = seededRng(55);
    const { session } = simulate(createSession(ids(25), []), () => rng() < 0.75);
    expect(isSessionComplete(session)).toBe(true);
  });

  it("review rounds end after two correct answers in a row per card", () => {
    const mastered = ids(5).map((id) => {
      let p = initialProgress(id);
      for (let i = 0; i < 6; i++) p = applyAnswer(p, true, new Date(start));
      return p;
    });
    const review = createSession(ids(5), mastered, "review");
    expect(isSessionComplete(review)).toBe(false);
    const { session, asked } = simulate(review, () => true);
    expect(isSessionComplete(session)).toBe(true);
    expect(asked.length).toBe(10);
  });
});

describe("summary helpers", () => {
  it("ranks hardest cards and lists hard cards", () => {
    let s = createSession(ids(7), []);
    const now = new Date(start);
    s = recordAnswer(s, "c2", false, now, () => 0);
    s = recordAnswer(s, "c3", true, now, () => 0);
    s = recordAnswer(s, "c2", false, now, () => 0);
    s = recordAnswer(s, "c4", false, now, () => 0);
    expect(hardestCardIds(s)).toEqual(["c2", "c4"]);
    expect(hardCardIds(s)).toEqual(["c2", "c4"]);
    expect(s).toMatchObject({ correct: 1, wrong: 3, questionNumber: 4 });
  });
});

describe("hinted answers", () => {
  it("count as correct but come back 3–5 questions later", () => {
    const now = new Date(start);
    let s = createSession(ids(10), []);
    s = recordAnswer(s, "c1", true, now, () => 0, { requeue: true });
    expect(s.correct).toBe(1);
    expect(s.progress.c1?.correctCount).toBe(1);
    const entry = s.requeue.find((r) => r.cardId === "c1");
    const gap = (entry?.dueAt ?? 0) - s.questionNumber; // comes back 3–5 questions later
    expect(gap).toBeGreaterThanOrEqual(REQUEUE_MIN);
    expect(gap).toBeLessThanOrEqual(REQUEUE_MAX);
    // Plain correct answers are not re-queued.
    expect(recordAnswer(s, "c2", true, now, () => 0).requeue.some((r) => r.cardId === "c2")).toBe(
      false,
    );
  });
});
