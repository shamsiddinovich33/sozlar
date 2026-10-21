import { describe, expect, it } from "vitest";

import { isProtectedPath } from "./auth.config";

describe("isProtectedPath", () => {
  it("protects app routes", () => {
    for (const p of ["/dashboard", "/library", "/profile", "/sets/new", "/sets/abc/learn"]) {
      expect(isProtectedPath(p)).toBe(true);
    }
  });

  it("leaves public routes open", () => {
    for (const p of ["/", "/login", "/register", "/settings-like", "/setsx"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });
});
