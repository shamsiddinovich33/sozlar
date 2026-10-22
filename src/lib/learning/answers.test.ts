import { describe, expect, it } from "vitest";

import {
  buildChoices,
  checkTypedAnswer,
  levenshtein,
  normalizeAnswer,
  questionTypeFor,
} from "./answers";
import { seededRng } from "./test-utils";

describe("questionTypeFor", () => {
  it("uses multiple choice for new/learning and typing for familiar/mastered", () => {
    expect(questionTypeFor("NEW")).toBe("multiple_choice");
    expect(questionTypeFor("LEARNING")).toBe("multiple_choice");
    expect(questionTypeFor("FAMILIAR")).toBe("typed");
    expect(questionTypeFor("MASTERED")).toBe("typed");
  });
});

describe("typed answers", () => {
  it("normalizes case, whitespace and apostrophes", () => {
    expect(normalizeAnswer("  O‘qituvchi   Uyi ")).toBe("o'qituvchi uyi");
    expect(checkTypedAnswer("Oʻzbek", "o'zbek")).toBe("correct");
  });

  it("accepts one typo only for words of 5+ characters", () => {
    expect(checkTypedAnswer("kitbo", "kitob")).toBe("wrong"); // 2 edits (swap)
    expect(checkTypedAnswer("kitop", "kitob")).toBe("almost");
    expect(checkTypedAnswer("mushk", "mushuk")).toBe("almost");
    expect(checkTypedAnswer("uv", "uy")).toBe("wrong");
    expect(checkTypedAnswer("olm", "olma")).toBe("wrong");
    expect(checkTypedAnswer("", "olma")).toBe("wrong");
  });

  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
  });
});

describe("buildChoices", () => {
  const pool = [
    { cardId: "1", text: "apple" },
    { cardId: "2", text: "apricot" },
    { cardId: "3", text: "Apple" }, // same text as the answer, different card
    { cardId: "4", text: "banana" },
    { cardId: "5", text: "avocado" },
    { cardId: "6", text: "kiwi" },
    { cardId: "7", text: "banana" }, // duplicate distractor text
    { cardId: "8", text: "watermelon tree" },
  ];
  const correct = pool[0]!;

  it("returns 4 unique options including the correct answer at correctIndex", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { options, correctIndex } = buildChoices(correct, pool, seededRng(seed));
      expect(options).toHaveLength(4);
      expect(options[correctIndex]).toEqual(correct);
      const texts = options.map((o) => normalizeAnswer(o.text));
      expect(new Set(texts).size).toBe(4);
    }
  });

  it("never offers a distractor equal to the correct answer", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { options } = buildChoices(correct, pool, seededRng(seed));
      expect(options.filter((o) => normalizeAnswer(o.text) === "apple")).toHaveLength(1);
    }
  });

  it("prefers similar distractors (same first letter, similar length)", () => {
    let similar = 0;
    for (let seed = 0; seed < 100; seed++) {
      const { options } = buildChoices(correct, pool, seededRng(seed));
      if (options.some((o) => o.text === "apricot")) similar++;
      expect(options.some((o) => o.text === "watermelon tree")).toBe(false);
    }
    expect(similar).toBeGreaterThan(90);
  });

  it("returns fewer options for tiny sets", () => {
    const { options } = buildChoices(
      correct,
      [correct, { cardId: "2", text: "pear" }],
      seededRng(1),
    );
    expect(options.map((o) => o.text).sort()).toEqual(["apple", "pear"]);
  });
});
