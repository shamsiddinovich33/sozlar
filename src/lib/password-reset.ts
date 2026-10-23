import { createHash, randomBytes } from "node:crypto";

/** A reset link works for one hour. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** SHA-256 of the token: the database never holds a usable link. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function isResetTokenUsable(
  row: { expiresAt: Date; usedAt: Date | null } | null,
  now: Date = new Date(),
): boolean {
  return !!row && row.usedAt === null && row.expiresAt.getTime() > now.getTime();
}
