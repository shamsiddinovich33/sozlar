import { describe, expect, it } from "vitest";

import { resetTokenSchema } from "@/lib/validators/auth";

import { generateResetToken, hashResetToken, isResetTokenUsable } from "./password-reset";

describe("password reset tokens", () => {
  it("generates unique url-safe tokens that match the schema", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
    expect(resetTokenSchema.safeParse(a.token).success).toBe(true);
    expect(a.tokenHash).toBe(hashResetToken(a.token));
    expect(a.tokenHash).not.toContain(a.token);
  });

  it("accepts only unused, unexpired tokens", () => {
    const now = new Date("2026-10-23T10:00:00Z");
    const later = new Date("2026-10-23T11:00:00Z");
    const earlier = new Date("2026-10-23T09:00:00Z");
    expect(isResetTokenUsable({ expiresAt: later, usedAt: null }, now)).toBe(true);
    expect(isResetTokenUsable({ expiresAt: earlier, usedAt: null }, now)).toBe(false);
    expect(isResetTokenUsable({ expiresAt: later, usedAt: earlier }, now)).toBe(false);
    expect(isResetTokenUsable(null, now)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(resetTokenSchema.safeParse("short").success).toBe(false);
    expect(resetTokenSchema.safeParse("a".repeat(42) + "/").success).toBe(false);
  });
});
