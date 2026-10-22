import { describe, expect, it } from "vitest";

import {
  buildOrder,
  countResults,
  createDeck,
  deckReducer,
  shuffled,
  unknownIds,
  type DeckCard,
  type DeckState,
} from "./deck";

const cards: DeckCard[] = ["a", "b", "c", "d"].map((id) => ({ id, term: id, definition: id }));
const run = (state: DeckState, ...actions: Parameters<typeof deckReducer>[1][]) =>
  actions.reduce(deckReducer, state);

describe("deckReducer", () => {
  it("flips and resets the flip when moving", () => {
    const s = run(createDeck(["a", "b"]), { type: "flip" });
    expect(s.flipped).toBe(true);
    expect(run(s, { type: "next" })).toMatchObject({ index: 1, flipped: false });
  });

  it("does not go before the first card and finishes after the last", () => {
    expect(run(createDeck(["a", "b"]), { type: "prev" }).index).toBe(0);
    const end = run(createDeck(["a", "b"]), { type: "next" }, { type: "next" });
    expect(end.finished).toBe(true);
    expect(run(end, { type: "prev" })).toMatchObject({ finished: false, index: 1 });
  });

  it("marks results, advances, and lets a later mark override", () => {
    const s = run(
      createDeck(["a", "b", "c"]),
      { type: "mark", result: "known" },
      { type: "mark", result: "unknown" },
      { type: "prev" },
      { type: "mark", result: "known" },
      { type: "mark", result: "unknown" },
    );
    expect(s.finished).toBe(true);
    expect(s.results).toEqual({ a: "known", b: "known", c: "unknown" });
    expect(countResults(s)).toEqual({ known: 2, unknown: 1 });
    expect(unknownIds(s)).toEqual(["c"]);
  });

  it("restarts with a new order", () => {
    const s = run(
      createDeck(["a", "b"]),
      { type: "mark", result: "known" },
      { type: "restart", order: ["b"] },
    );
    expect(s).toEqual(createDeck(["b"]));
  });

  it("an empty deck is finished", () => {
    expect(createDeck([]).finished).toBe(true);
  });
});

describe("buildOrder", () => {
  it("keeps set order without shuffle and filters starred cards", () => {
    expect(buildOrder(cards, new Set(), { shuffle: false, starredOnly: false, seed: 1 })).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(
      buildOrder(cards, new Set(["d", "b"]), { shuffle: false, starredOnly: true, seed: 1 }),
    ).toEqual(["b", "d"]);
  });

  it("shuffles deterministically by seed without losing cards", () => {
    const a = shuffled(["a", "b", "c", "d", "e", "f"], 42);
    expect(shuffled(["a", "b", "c", "d", "e", "f"], 42)).toEqual(a);
    expect([...a].sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(shuffled(["a", "b", "c", "d", "e", "f"], 7)).not.toEqual(a);
  });
});
