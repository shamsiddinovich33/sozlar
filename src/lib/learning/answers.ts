import type { Mastery, Rng } from "./types";

export type QuestionType = "multiple_choice" | "typed";
export type TypedResult = "correct" | "almost" | "wrong";

/** Typo tolerance applies only to answers at least this long. */
export const TYPO_MIN_LENGTH = 5;
export const MAX_OPTIONS = 4;

/** New and learning words get multiple choice; familiar and mastered words must be typed. */
export function questionTypeFor(mastery: Mastery): QuestionType {
  return mastery === "FAMILIAR" || mastery === "MASTERED" ? "typed" : "multiple_choice";
}

/** Case-insensitive, trimmed, single-spaced; unifies apostrophe variants (o‘ / oʻ / o’ → o'). */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[‘’ʻʼ`´]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** Exact (normalized) match is correct; one typo in a word of 5+ characters is "almost". */
export function checkTypedAnswer(input: string, expected: string): TypedResult {
  const given = normalizeAnswer(input);
  const target = normalizeAnswer(expected);
  if (!given) return "wrong";
  if (given === target) return "correct";
  if (target.length >= TYPO_MIN_LENGTH && levenshtein(given, target) <= 1) return "almost";
  return "wrong";
}

export type Choice = { cardId: string; text: string };

/**
 * Up to MAX_OPTIONS options: the correct answer plus distractors from the same set that look
 * similar (same first letter, similar length). Distractor texts never equal the correct answer
 * and never repeat each other.
 */
export function buildChoices(
  correct: Choice,
  pool: readonly Choice[],
  rng: Rng,
): { options: Choice[]; correctIndex: number } {
  const target = normalizeAnswer(correct.text);
  const seen = new Set([target]);
  const candidates: { choice: Choice; score: number }[] = [];

  for (const choice of pool) {
    const key = normalizeAnswer(choice.text);
    if (choice.cardId === correct.cardId || !key || seen.has(key)) continue;
    seen.add(key);
    const lengthGap = Math.abs(key.length - target.length) / Math.max(target.length, 1);
    const sameStart = key[0] === target[0] ? 0 : 1;
    // Lower is more similar; a little randomness keeps distractors varied between questions.
    candidates.push({
      choice,
      score: sameStart * 0.6 + Math.min(lengthGap, 1) * 0.6 + rng() * 0.5,
    });
  }

  const distractors = candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_OPTIONS - 1)
    .map((c) => c.choice);

  const options = [...distractors];
  const correctIndex = Math.floor(rng() * (options.length + 1));
  options.splice(correctIndex, 0, correct);
  return { options, correctIndex };
}
