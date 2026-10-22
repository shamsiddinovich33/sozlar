import type { CardProgressState, Mastery } from "./types";

export const MIN_BOX = 0;
export const MAX_BOX = 4;
export const MIN_WEIGHT = 0.2;
export const MAX_WEIGHT = 8;
export const INITIAL_WEIGHT = 1;

const MINUTE = 60_000;
/** How long until a card is due again, by box. */
export const BOX_INTERVALS_MS: readonly number[] = [
  0,
  MINUTE,
  5 * MINUTE,
  30 * MINUTE,
  24 * 60 * MINUTE,
];

export function initialProgress(cardId: string): CardProgressState {
  return {
    cardId,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    box: MIN_BOX,
    weight: INITIAL_WEIGHT,
    mastery: "NEW",
    lastSeenAt: null,
    nextDueAt: null,
  };
}

/**
 * box 0 → NEW (never answered wrong) or LEARNING, box 1–2 → LEARNING, box 3 → FAMILIAR,
 * box 4 → MASTERED once the streak is at least 3 (otherwise FAMILIAR).
 */
export function masteryFor(p: Pick<CardProgressState, "box" | "streak" | "wrongCount">): Mastery {
  if (p.box <= 0) return p.wrongCount > 0 ? "LEARNING" : "NEW";
  if (p.box <= 2) return "LEARNING";
  if (p.box === 3) return "FAMILIAR";
  return p.streak >= 3 ? "MASTERED" : "FAMILIAR";
}

/** Applies one answer. "Bilmayman" (don't know) counts as wrong. Returns a new object. */
export function applyAnswer(
  progress: CardProgressState,
  isCorrect: boolean,
  now: Date,
): CardProgressState {
  let { streak, box, weight, correctCount, wrongCount } = progress;

  if (isCorrect) {
    correctCount += 1;
    streak += 1;
    weight = Math.max(MIN_WEIGHT, weight * 0.6);
    if (streak >= 2) box = Math.min(MAX_BOX, box + 1);
  } else {
    wrongCount += 1;
    streak = 0;
    box = Math.max(MIN_BOX, box - 1);
    weight = Math.min(MAX_WEIGHT, weight * 2 + 0.5);
  }

  const interval = BOX_INTERVALS_MS[box] ?? 0;
  return {
    ...progress,
    correctCount,
    wrongCount,
    streak,
    box,
    weight,
    mastery: masteryFor({ box, streak, wrongCount }),
    lastSeenAt: now,
    nextDueAt: new Date(now.getTime() + interval),
  };
}

export function errorRate(p: Pick<CardProgressState, "correctCount" | "wrongCount">): number {
  const attempts = p.correctCount + p.wrongCount;
  return attempts === 0 ? 0 : p.wrongCount / attempts;
}
