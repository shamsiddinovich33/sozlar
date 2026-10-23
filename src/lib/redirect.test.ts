import { describe, expect, it } from "vitest";

import { DEFAULT_REDIRECT, safeRedirectPath, withCallback } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps internal paths", () => {
    expect(safeRedirectPath("/sets/abc?x=1")).toBe("/sets/abc?x=1");
  });

  it("reduces absolute URLs to their path", () => {
    expect(safeRedirectPath("http://localhost:3000/library")).toBe("/library");
    expect(safeRedirectPath("https://evil.com/library")).toBe("/library");
  });

  it("falls back for empty, protocol-relative or auth routes", () => {
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("//evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/login")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/reset-password/abc")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/forgot-password")).toBe(DEFAULT_REDIRECT);
  });
});

describe("withCallback", () => {
  it("carries a safe target and drops unsafe or default ones", () => {
    expect(withCallback("/register", "/groups/join/abc")).toBe(
      "/register?callbackUrl=%2Fgroups%2Fjoin%2Fabc",
    );
    expect(withCallback("/register", "https://evil.com")).toBe("/register");
    expect(withCallback("/login", undefined)).toBe("/login");
  });
});
