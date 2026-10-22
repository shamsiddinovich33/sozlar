export type EditorCard = { id: string; term: string; definition: string };
export type SavedCard = EditorCard & { position: number };

export function isCardComplete(card: EditorCard): boolean {
  return card.term.trim() !== "" && card.definition.trim() !== "";
}

export function isCardBlank(card: EditorCard): boolean {
  return card.term.trim() === "" && card.definition.trim() === "";
}

/** Complete cards in editor order, trimmed, with positions; this is what gets persisted. */
export function toSavedCards(cards: readonly EditorCard[]): SavedCard[] {
  return cards.filter(isCardComplete).map((c, position) => ({
    id: c.id,
    term: c.term.trim(),
    definition: c.definition.trim(),
    position,
  }));
}

export type CardDiff = { create: SavedCard[]; update: SavedCard[]; deleteIds: string[] };

/**
 * Changes needed to turn `saved` into `next`.
 * A previously saved card that is now incomplete is left untouched (not deleted) until completed again.
 */
export function diffCards(
  saved: readonly SavedCard[],
  next: readonly SavedCard[],
  incompleteIds: ReadonlySet<string> = new Set(),
): CardDiff {
  const savedById = new Map(saved.map((c) => [c.id, c]));
  const nextIds = new Set(next.map((c) => c.id));
  const create: SavedCard[] = [];
  const update: SavedCard[] = [];

  for (const card of next) {
    const prev = savedById.get(card.id);
    if (!prev) create.push(card);
    else if (
      prev.term !== card.term ||
      prev.definition !== card.definition ||
      prev.position !== card.position
    ) {
      update.push(card);
    }
  }

  const deleteIds = saved
    .filter((c) => !nextIds.has(c.id) && !incompleteIds.has(c.id))
    .map((c) => c.id);
  return { create, update, deleteIds };
}

export function isDiffEmpty(diff: CardDiff): boolean {
  return diff.create.length === 0 && diff.update.length === 0 && diff.deleteIds.length === 0;
}

/** Applies a diff to the saved snapshot (used after a successful save). */
export function applyDiff(saved: readonly SavedCard[], diff: CardDiff): SavedCard[] {
  const deleted = new Set(diff.deleteIds);
  const changed = new Map([...diff.create, ...diff.update].map((c) => [c.id, c]));
  const kept = saved.filter((c) => !deleted.has(c.id) && !changed.has(c.id));
  return [...kept, ...changed.values()].sort((a, b) => a.position - b.position);
}

/** Lower-cased terms that appear more than once among non-blank cards. */
export function findDuplicateTerms(cards: readonly EditorCard[]): Set<string> {
  const counts = new Map<string, number>();
  for (const c of cards) {
    const key = c.term.trim().toLocaleLowerCase();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([k]) => k));
}
