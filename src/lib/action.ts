import "server-only";

import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types/actions";

/** An error whose message is safe to show to the user. */
export class ActionError extends Error {}

export const ACTION_ERRORS = {
  unauthenticated: "Avval tizimga kiring",
  notFound: "To'plam topilmadi",
  invalid: "Ma'lumotlar noto'g'ri",
  generic: "Nimadir xato ketdi. Iltimos, qayta urinib ko'ring",
} as const;

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new ActionError(ACTION_ERRORS.unauthenticated);
  return id;
}

/** Runs an action body and converts thrown errors into a typed result. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message };
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? ACTION_ERRORS.invalid };
    }
    console.error(error);
    return { ok: false, error: ACTION_ERRORS.generic };
  }
}
