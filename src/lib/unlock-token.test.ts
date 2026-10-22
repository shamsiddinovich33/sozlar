import { describe, expect, it } from "vitest";

import { UNLOCK_TTL_MS, signUnlockToken, verifyUnlockToken } from "./unlock-token";

const secret = "test-secret";
const now = 1_700_000_000_000;

describe("unlock token", () => {
  const token = signUnlockToken(secret, "set1", "user1", now);

  it("verifies for the same set and user", () => {
    expect(verifyUnlockToken(secret, token, "set1", "user1", now + 1000)).toBe(true);
  });

  it("is bound to the set, the user and the secret", () => {
    expect(verifyUnlockToken(secret, token, "set2", "user1", now)).toBe(false);
    expect(verifyUnlockToken(secret, token, "set1", "user2", now)).toBe(false);
    expect(verifyUnlockToken("other", token, "set1", "user1", now)).toBe(false);
  });

  it("expires and rejects tampering", () => {
    expect(verifyUnlockToken(secret, token, "set1", "user1", now + UNLOCK_TTL_MS + 1)).toBe(false);
    const [, sig] = token.split(".");
    expect(
      verifyUnlockToken(secret, `${now + UNLOCK_TTL_MS * 10}.${sig}`, "set1", "user1", now),
    ).toBe(false);
    expect(verifyUnlockToken(secret, undefined, "set1", "user1", now)).toBe(false);
    expect(verifyUnlockToken(secret, "garbage", "set1", "user1", now)).toBe(false);
  });
});
