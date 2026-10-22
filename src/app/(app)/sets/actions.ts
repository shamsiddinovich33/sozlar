"use server";

import { randomUUID } from "node:crypto";
import { Prisma, Visibility } from "@prisma/client";

import { ActionError, requireUserId, runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { parseImport, validateImportOptions } from "@/lib/import-parser";
import { LIMITS } from "@/lib/limits";
import { hashPassword } from "@/lib/password";
import { getOwnedSetOrThrow } from "@/lib/queries/owned-set";
import type { SavedCard } from "@/lib/set-sync";
import {
  importCardsSchema,
  saveSetSchema,
  setIdSchema,
  visibilitySchema,
  type CardInput,
} from "@/lib/validators/set";
import type { ActionResult } from "@/types/actions";

const TOO_MANY_CARDS = `Bitta to'plamda ${LIMITS.cardsPerSet} tadan ortiq karta bo'lishi mumkin emas`;

async function assertCardLimit(tx: Prisma.TransactionClient, setId: string): Promise<void> {
  const count = await tx.card.count({ where: { setId } });
  if (count > LIMITS.cardsPerSet) throw new ActionError(TOO_MANY_CARDS);
}

/** Batch-updates cards of one set in a single statement. */
async function updateCards(
  tx: Prisma.TransactionClient,
  setId: string,
  cards: CardInput[],
): Promise<void> {
  if (cards.length === 0) return;
  const values = Prisma.join(
    cards.map((c) => Prisma.sql`(${c.id}, ${c.term}, ${c.definition}, ${c.position}::int)`),
  );
  await tx.$executeRaw`
    UPDATE "Card" AS c
    SET "term" = v.term, "definition" = v.definition, "position" = v.position, "updatedAt" = now()
    FROM (VALUES ${values}) AS v(id, term, definition, position)
    WHERE c."id" = v.id AND c."setId" = ${setId}`;
}

/** Creates a new set with its first cards. */
export async function createSet(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const data = saveSetSchema.parse(input);
    return db.$transaction(async (tx) => {
      const set = await tx.set.create({
        data: { ownerId: userId, title: data.title, description: data.description },
        select: { id: true },
      });
      await tx.card.createMany({
        data: data.create.map((c) => ({ ...c, setId: set.id })),
        skipDuplicates: true,
      });
      await assertCardLimit(tx, set.id);
      return set;
    });
  });
}

/** Saves set details and incremental card changes. Only the owner may save. */
export async function saveSet(setId: unknown, input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    const data = saveSetSchema.parse(input);

    await db.$transaction(async (tx) => {
      await getOwnedSetOrThrow(id, userId, { id: true }, tx);
      await tx.set.update({
        where: { id },
        data: { title: data.title, description: data.description },
      });
      if (data.deleteIds.length > 0) {
        await tx.card.deleteMany({ where: { setId: id, id: { in: data.deleteIds } } });
      }
      // skipDuplicates: an id that already exists elsewhere is ignored rather than overwritten.
      if (data.create.length > 0) {
        await tx.card.createMany({
          data: data.create.map((c) => ({ ...c, setId: id })),
          skipDuplicates: true,
        });
      }
      await updateCards(tx, id, data.update);
      await assertCardLimit(tx, id);
    });
    return null;
  });
}

/** Parses pasted text / CSV on the server and appends valid rows to the set. */
export async function importCards(
  setId: unknown,
  input: unknown,
): Promise<ActionResult<{ cards: SavedCard[]; skipped: number }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    const { text, options } = importCardsSchema.parse(input);

    const optionsError = validateImportOptions(options);
    if (optionsError) throw new ActionError(optionsError);
    const parsed = parseImport(text, options);
    if (parsed.cards.length === 0) throw new ActionError("Import qilish uchun to'g'ri qator yo'q");

    const cards = await db.$transaction(async (tx) => {
      await getOwnedSetOrThrow(id, userId, { id: true }, tx);
      const last = await tx.card.aggregate({ where: { setId: id }, _max: { position: true } });
      const start = (last._max.position ?? -1) + 1;
      const created = await tx.card.createManyAndReturn({
        data: parsed.cards.map((c, i) => ({
          id: randomUUID(),
          setId: id,
          term: c.term,
          definition: c.definition,
          position: start + i,
        })),
        select: { id: true, term: true, definition: true, position: true },
      });
      await assertCardLimit(tx, id);
      await tx.set.update({ where: { id }, data: { updatedAt: new Date() } });
      return created;
    });
    return { cards: cards.sort((a, b) => a.position - b.position), skipped: parsed.invalidCount };
  });
}

/** Changes who can see the set. Passwords are stored as bcrypt hashes. */
export async function updateVisibility(
  setId: unknown,
  input: unknown,
): Promise<ActionResult<{ visibility: Visibility; hasPassword: boolean }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = setIdSchema.parse(setId);
    const data = visibilitySchema.parse(input);
    const set = await getOwnedSetOrThrow(id, userId, { passwordHash: true });

    let passwordHash: string | null = null;
    if (data.visibility === Visibility.PASSWORD) {
      if (data.password) passwordHash = await hashPassword(data.password);
      else if (set.passwordHash) passwordHash = set.passwordHash;
      else throw new ActionError(`Parol kamida ${LIMITS.setPasswordMin} ta belgi bo'lishi kerak`);
    }

    await db.set.update({ where: { id }, data: { visibility: data.visibility, passwordHash } });
    return { visibility: data.visibility, hasPassword: passwordHash !== null };
  });
}
