import { describe, expect, it } from "vitest";

import { AUTH_MESSAGES, getAuthErrorMessage } from "./auth-errors";

describe("getAuthErrorMessage", () => {
  it("returns null without a code", () => {
    expect(getAuthErrorMessage(null)).toBeNull();
    expect(getAuthErrorMessage("")).toBeNull();
  });

  it("maps known codes to Uzbek messages", () => {
    expect(getAuthErrorMessage("CredentialsSignin")).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(getAuthErrorMessage("OAuthAccountNotLinked")).toContain("boshqa usul");
  });

  it("falls back to a generic message", () => {
    expect(getAuthErrorMessage("Whatever")).toBe(AUTH_MESSAGES.generic);
  });
});
