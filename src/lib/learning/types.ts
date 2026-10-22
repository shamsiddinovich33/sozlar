/** Mirrors the Prisma `Mastery` enum without depending on it (this module is framework-independent). */
export type Mastery = "NEW" | "LEARNING" | "FAMILIAR" | "MASTERED";

export type CardProgressState = {
  cardId: string;
  correctCount: number;
  wrongCount: number;
  /** Consecutive correct answers */
  streak: number;
  /** Leitner-like box, 0–4 */
  box: number;
  weight: number;
  mastery: Mastery;
  lastSeenAt: Date | null;
  nextDueAt: Date | null;
};

/** Random number source in [0, 1); injectable for deterministic tests. */
export type Rng = () => number;
