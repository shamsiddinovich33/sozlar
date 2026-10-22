import { createHmac, timingSafeEqual } from "node:crypto";

export const UNLOCK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function unlockCookieName(setId: string): string {
  return `set_unlock_${setId}`;
}

function signature(secret: string, setId: string, userId: string, expiresAt: number): string {
  return createHmac("sha256", secret).update(`${setId}:${userId}:${expiresAt}`).digest("base64url");
}

/**
 * Token proving `userId` entered the password of `setId`. Bound to both ids, so it can't be
 * reused for another set or shared with another account.
 */
export function signUnlockToken(
  secret: string,
  setId: string,
  userId: string,
  now: number = Date.now(),
): string {
  const expiresAt = now + UNLOCK_TTL_MS;
  return `${expiresAt}.${signature(secret, setId, userId, expiresAt)}`;
}

export function verifyUnlockToken(
  secret: string,
  token: string | undefined,
  setId: string,
  userId: string,
  now: number = Date.now(),
): boolean {
  if (!token) return false;
  const [expiresRaw, sig] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!sig || !Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const expected = Buffer.from(signature(secret, setId, userId, expiresAt));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
