export type DeckCard = { id: string; term: string; definition: string };
export type CardResult = "known" | "unknown";

export type DeckState = {
  /** Card ids in study order for this round */
  order: string[];
  index: number;
  flipped: boolean;
  results: Record<string, CardResult>;
  finished: boolean;
};

export type DeckAction =
  | { type: "flip" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "mark"; result: CardResult }
  | { type: "restart"; order: string[] };

export type OrderOptions = { shuffle: boolean; starredOnly: boolean; seed: number };

/** Deterministic PRNG (mulberry32), so shuffles are reproducible in tests. */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const rng = createRng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Card ids for a new round, honoring the starred-only filter and shuffle. */
export function buildOrder(
  cards: readonly DeckCard[],
  starredIds: ReadonlySet<string>,
  options: OrderOptions,
): string[] {
  const ids = cards.map((c) => c.id).filter((id) => !options.starredOnly || starredIds.has(id));
  return options.shuffle ? shuffled(ids, options.seed) : ids;
}

export function createDeck(order: string[]): DeckState {
  return { order, index: 0, flipped: false, results: {}, finished: order.length === 0 };
}

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "flip":
      return state.finished ? state : { ...state, flipped: !state.flipped };
    case "prev":
      if (state.finished) return { ...state, finished: false, flipped: false };
      return state.index > 0 ? { ...state, index: state.index - 1, flipped: false } : state;
    case "next":
      if (state.finished) return state;
      if (state.index >= state.order.length - 1)
        return { ...state, finished: true, flipped: false };
      return { ...state, index: state.index + 1, flipped: false };
    case "mark": {
      const id = state.order[state.index];
      if (state.finished || !id) return state;
      const marked = { ...state, results: { ...state.results, [id]: action.result } };
      return deckReducer(marked, { type: "next" });
    }
    case "restart":
      return createDeck(action.order);
  }
}

export function countResults(state: DeckState): { known: number; unknown: number } {
  let known = 0;
  let unknown = 0;
  for (const id of state.order) {
    if (state.results[id] === "known") known++;
    else if (state.results[id] === "unknown") unknown++;
  }
  return { known, unknown };
}

/** Ids marked "unknown" in this round, in round order. */
export function unknownIds(state: DeckState): string[] {
  return state.order.filter((id) => state.results[id] === "unknown");
}
