import { describe, expect, it } from "vitest";

import {
  applyDiff,
  diffCards,
  findDuplicateTerms,
  isDiffEmpty,
  toSavedCards,
  type SavedCard,
} from "./set-sync";

const saved: SavedCard[] = [
  { id: "aaaaaaaa", term: "apple", definition: "olma", position: 0 },
  { id: "bbbbbbbb", term: "book", definition: "kitob", position: 1 },
  { id: "cccccccc", term: "cat", definition: "mushuk", position: 2 },
];

describe("toSavedCards", () => {
  it("keeps complete cards only, trimmed and renumbered", () => {
    expect(
      toSavedCards([
        { id: "1", term: " a ", definition: "b" },
        { id: "2", term: "x", definition: " " },
        { id: "3", term: "c", definition: "d" },
      ]),
    ).toEqual([
      { id: "1", term: "a", definition: "b", position: 0 },
      { id: "3", term: "c", definition: "d", position: 1 },
    ]);
  });
});

describe("diffCards", () => {
  it("is empty when nothing changed", () => {
    expect(isDiffEmpty(diffCards(saved, saved))).toBe(true);
  });

  it("detects creates, edits, reorders and deletes", () => {
    const next: SavedCard[] = [
      { id: "cccccccc", term: "cat", definition: "mushuk", position: 0 },
      { id: "aaaaaaaa", term: "apple", definition: "olma!", position: 1 },
      { id: "dddddddd", term: "dog", definition: "it", position: 2 },
    ];
    const diff = diffCards(saved, next);
    expect(diff.create.map((c) => c.id)).toEqual(["dddddddd"]);
    expect(diff.update.map((c) => c.id)).toEqual(["cccccccc", "aaaaaaaa"]);
    expect(diff.deleteIds).toEqual(["bbbbbbbb"]);
  });

  it("does not delete saved cards that are only temporarily incomplete", () => {
    const next = saved
      .filter((c) => c.id !== "bbbbbbbb")
      .map((c, position) => ({ ...c, position }));
    expect(diffCards(saved, next, new Set(["bbbbbbbb"])).deleteIds).toEqual([]);
  });

  it("applyDiff reproduces the next state", () => {
    const next: SavedCard[] = [
      { id: "cccccccc", term: "cat", definition: "mushuk", position: 0 },
      { id: "dddddddd", term: "dog", definition: "it", position: 1 },
    ];
    expect(applyDiff(saved, diffCards(saved, next))).toEqual(next);
  });
});

describe("findDuplicateTerms", () => {
  it("finds case-insensitive duplicates and ignores blanks", () => {
    const dupes = findDuplicateTerms([
      { id: "1", term: "Apple", definition: "" },
      { id: "2", term: " apple ", definition: "x" },
      { id: "3", term: "", definition: "" },
      { id: "4", term: "", definition: "y" },
      { id: "5", term: "book", definition: "" },
    ]);
    expect([...dupes]).toEqual(["apple"]);
  });
});
