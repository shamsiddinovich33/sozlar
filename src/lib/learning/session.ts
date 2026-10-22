import { initialProgress, applyAnswer, errorRate } from "./progress";
import { HARD_ERROR_RATE, pickNextCard } from "./pick";
import type { CardProgressState, Rng } from "./types";

export const BATCH_SIZE = 7;
/** A batch is "settled" when at most this many active, unmastered cards are below FAMILIAR. */
export const BATCH_MAX_STRUGGLING = 2;
export const REQUEUE_MIN = 3;
export const REQUEUE_MAX = 5;
export const CHECKIN_EVERY = 10;
/**
 * Share of questions that may review already-finished (mastered) cards while others are still
 * being learned. Without a cap, a mostly-mastered set would keep asking mastered cards and a
 * learner who sometimes slips could never finish.
 */
export const MASTERED_REVIEW_SHARE = 0.08;
const RECENT_KEEP = 5;
/** Correct answers in a row needed per card to finish a "review" round. */
export const REVIEW_STREAK_GOAL = 2;

/**
 * - "mastery": normal Learn; ends when every card is MASTERED.
 * - "review": practice a subset (e.g. hard words) regardless of mastery; ends when each card
 *   was answered correctly REVIEW_STREAK_GOAL times in a row during this round.
 */
export type SessionGoal = "mastery" | "review";

export type LearnSession = {
  goal: SessionGoal;
  /** Cards in scope, in set order */
  cardIds: string[];
  progress: Record<string, CardProgressState>;
  /** Cards introduced so far */
  activeIds: string[];
  /** Recently shown cards, most recent last */
  recentIds: string[];
  /** Wrong cards that must come back at question number `dueAt` */
  requeue: { cardId: string; dueAt: number }[];
  /** Number of answered questions */
  questionNumber: number;
  correct: number;
  wrong: number;
  wrongByCard: Record<string, number>;
  /** Consecutive correct answers per card within this session */
  roundStreak: Record<string, number>;
};

function hasAttempts(p: CardProgressState): boolean {
  return p.correctCount + p.wrongCount > 0;
}

function isRoundDone(session: LearnSession, cardId: string): boolean {
  if (session.goal === "review") return (session.roundStreak[cardId] ?? 0) >= REVIEW_STREAK_GOAL;
  return session.progress[cardId]?.mastery === "MASTERED";
}

/** Adds the next batch of unseen cards once the current ones are mostly learned. */
export function maybeIntroduceBatch(session: LearnSession): LearnSession {
  const active = new Set(session.activeIds);
  const unseen = session.cardIds.filter((id) => !active.has(id));
  if (unseen.length === 0) return session;

  const pending = session.activeIds.filter((id) => !isRoundDone(session, id));
  const settled =
    pending.length === 0 ||
    (pending.every((id) => (session.progress[id]?.correctCount ?? 0) > 0) &&
      pending.filter((id) => {
        const mastery = session.progress[id]?.mastery;
        return mastery === "NEW" || mastery === "LEARNING";
      }).length <= BATCH_MAX_STRUGGLING);
  if (!settled) return session;

  return { ...session, activeIds: [...session.activeIds, ...unseen.slice(0, BATCH_SIZE)] };
}

/** Starts (or resumes) a session. Cards already studied are active from the start. */
export function createSession(
  cardIds: readonly string[],
  saved: readonly CardProgressState[],
  goal: SessionGoal = "mastery",
): LearnSession {
  const savedById = new Map(saved.map((p) => [p.cardId, p]));
  const progress: Record<string, CardProgressState> = {};
  for (const id of cardIds) progress[id] = savedById.get(id) ?? initialProgress(id);

  const session: LearnSession = {
    goal,
    cardIds: [...cardIds],
    progress,
    activeIds: goal === "mastery" ? cardIds.filter((id) => hasAttempts(progress[id]!)) : [],
    recentIds: [],
    requeue: [],
    questionNumber: 0,
    correct: 0,
    wrong: 0,
    wrongByCard: {},
    roundStreak: {},
  };
  return maybeIntroduceBatch(session);
}

export function isSessionComplete(session: LearnSession): boolean {
  return session.cardIds.every((id) => isRoundDone(session, id));
}

/** Next card to ask, or null when the session is complete. Due re-queued cards come first. */
export function nextCardId(
  session: LearnSession,
  now: Date,
  rng: Rng = Math.random,
): string | null {
  if (isSessionComplete(session)) return null;
  const upcoming = session.questionNumber + 1;
  const lastShown = session.recentIds[session.recentIds.length - 1];

  const due = session.requeue
    .filter((r) => r.dueAt <= upcoming && r.cardId !== lastShown)
    .sort((a, b) => a.dueAt - b.dueAt)[0];
  if (due) return due.cardId;

  // Re-queued cards wait for their slot, so they come back exactly 3–5 questions later.
  const waiting = new Set(session.requeue.map((r) => r.cardId));
  const allActive = session.activeIds.map((id) => session.progress[id]!);
  const notWaiting = allActive.filter((p) => !waiting.has(p.cardId));
  const active = notWaiting.some((p) => p.cardId !== lastShown) ? notWaiting : allActive;
  const learning = active.filter((p) => !isRoundDone(session, p.cardId));
  const review =
    session.goal === "mastery" ? active.filter((p) => isRoundDone(session, p.cardId)) : [];
  const usable = (group: CardProgressState[]) => group.some((p) => p.cardId !== lastShown);

  // Usually pick among cards still being learned; occasionally review a finished one.
  const wantReview = usable(review) && (rng() < MASTERED_REVIEW_SHARE || !usable(learning));
  const group = wantReview ? review : usable(learning) ? learning : active;
  return pickNextCard(group, session.recentIds, now, rng);
}

/** Question number at which a wrongly answered card must reappear (3–5 questions later). */
function requeueSlot(session: LearnSession, rng: Rng): number {
  const taken = new Set(session.requeue.map((r) => r.dueAt));
  const offsets = [REQUEUE_MIN, REQUEUE_MIN + 1, REQUEUE_MAX];
  const start = Math.floor(rng() * offsets.length);
  for (let i = 0; i < offsets.length; i++) {
    const slot = session.questionNumber + offsets[(start + i) % offsets.length]!;
    if (!taken.has(slot)) return slot;
  }
  return session.questionNumber + REQUEUE_MIN;
}

/** Records an answer: updates progress, stats, recent history, re-queue and batches. */
export function recordAnswer(
  session: LearnSession,
  cardId: string,
  isCorrect: boolean,
  now: Date,
  rng: Rng = Math.random,
): LearnSession {
  const current = session.progress[cardId];
  if (!current) return session;

  const base: LearnSession = {
    ...session,
    progress: { ...session.progress, [cardId]: applyAnswer(current, isCorrect, now) },
    questionNumber: session.questionNumber + 1,
    recentIds: [...session.recentIds, cardId].slice(-RECENT_KEEP),
    requeue: session.requeue.filter((r) => r.cardId !== cardId),
    correct: session.correct + (isCorrect ? 1 : 0),
    wrong: session.wrong + (isCorrect ? 0 : 1),
    wrongByCard: isCorrect
      ? session.wrongByCard
      : { ...session.wrongByCard, [cardId]: (session.wrongByCard[cardId] ?? 0) + 1 },
    roundStreak: {
      ...session.roundStreak,
      [cardId]: isCorrect ? (session.roundStreak[cardId] ?? 0) + 1 : 0,
    },
  };
  const withRequeue = isCorrect
    ? base
    : { ...base, requeue: [...base.requeue, { cardId, dueAt: requeueSlot(base, rng) }] };
  return maybeIntroduceBatch(withRequeue);
}

/** Share of in-scope cards that are done (mastered, or finished in a review round), 0–100. */
export function sessionPercent(session: LearnSession): number {
  if (session.cardIds.length === 0) return 100;
  const done = session.cardIds.filter((id) => isRoundDone(session, id)).length;
  return Math.round((done / session.cardIds.length) * 100);
}

/** Up to `limit` hardest cards: most wrong answers this session, then highest overall error rate. */
export function hardestCardIds(session: LearnSession, limit = 5): string[] {
  return session.cardIds
    .filter(
      (id) => (session.wrongByCard[id] ?? 0) > 0 || (session.progress[id]?.wrongCount ?? 0) > 0,
    )
    .sort((a, b) => {
      const byWrong = (session.wrongByCard[b] ?? 0) - (session.wrongByCard[a] ?? 0);
      if (byWrong !== 0) return byWrong;
      return errorRate(session.progress[b]!) - errorRate(session.progress[a]!);
    })
    .slice(0, limit);
}

/** Cards for a "hard words only" round: wrong in this session or error rate above 40%. */
export function hardCardIds(session: LearnSession): string[] {
  return session.cardIds.filter(
    (id) =>
      (session.wrongByCard[id] ?? 0) > 0 || errorRate(session.progress[id]!) > HARD_ERROR_RATE,
  );
}
