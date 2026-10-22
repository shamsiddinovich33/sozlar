import { errorRate } from "./progress";
import type { CardProgressState, Rng } from "./types";

/** How many of the most recently shown cards are excluded from the next pick. */
export const RECENT_EXCLUDE = 3;
export const HARD_ERROR_RATE = 0.4;
/** Minutes assumed for a card that was never shown (gives the maximum recency factor). */
const UNSEEN_MINUTES = 20;

export function recencyFactor(p: CardProgressState, now: Date): number {
  const minutesSince = p.lastSeenAt
    ? (now.getTime() - p.lastSeenAt.getTime()) / 60_000
    : UNSEEN_MINUTES;
  return 1 + Math.min(Math.max(minutesSince, 0) / 10, 2);
}

export function dueFactor(p: CardProgressState, now: Date): number {
  return !p.nextDueAt || p.nextDueAt.getTime() <= now.getTime() ? 1.5 : 0.7;
}

/** Selection score: weight × recencyFactor × dueFactor, ×1.5 for cards with error rate > 40%. */
export function scoreCard(p: CardProgressState, now: Date): number {
  const hardBonus = errorRate(p) > HARD_ERROR_RATE ? 1.5 : 1;
  return p.weight * recencyFactor(p, now) * dueFactor(p, now) * hardBonus;
}

/** Picks an item with probability proportional to its weight. */
export function weightedSample<T>(
  items: readonly T[],
  weights: readonly number[],
  rng: Rng,
): T | null {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (items.length === 0) return null;
  if (total <= 0) return items[Math.floor(rng() * items.length)] ?? null;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i] ?? 0);
    if (r < 0) return items[i] ?? null;
  }
  return items[items.length - 1] ?? null;
}

/**
 * Chooses the next card id by weighted random sampling of scores.
 * The last few shown cards (`recentIds`, most recent last) are excluded, but never so many
 * that nothing is left: with a pool of n cards at most n − 1 are excluded.
 */
export function pickNextCard(
  progresses: readonly CardProgressState[],
  recentIds: readonly string[],
  now: Date,
  rng: Rng = Math.random,
): string | null {
  if (progresses.length === 0) return null;
  const poolIds = new Set(progresses.map((p) => p.cardId));
  const excludeCount = Math.min(RECENT_EXCLUDE, poolIds.size - 1);
  const recentInPool = recentIds.filter((id) => poolIds.has(id));
  const excluded = new Set(excludeCount > 0 ? recentInPool.slice(-excludeCount) : []);
  const candidates = progresses.filter((p) => !excluded.has(p.cardId));
  const pool = candidates.length > 0 ? candidates : progresses;
  return weightedSample(
    pool.map((p) => p.cardId),
    pool.map((p) => scoreCard(p, now)),
    rng,
  );
}
