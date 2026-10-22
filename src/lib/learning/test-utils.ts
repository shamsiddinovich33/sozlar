import { initialProgress } from "./progress";
import type { CardProgressState, Rng } from "./types";

/** Deterministic PRNG (mulberry32) for reproducible simulations. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeProgress(
  cardId: string,
  overrides: Partial<CardProgressState> = {},
): CardProgressState {
  return { ...initialProgress(cardId), ...overrides };
}

export const ids = (n: number, prefix = "c"): string[] =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
