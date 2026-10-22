import { describe, expect, it } from "vitest";

import { decideSetAccess } from "./set-access";

describe("decideSetAccess", () => {
  const owner = "owner";
  it("always allows the owner", () => {
    for (const visibility of ["PUBLIC", "PASSWORD", "PRIVATE"] as const) {
      expect(decideSetAccess({ ownerId: owner, visibility }, owner, false)).toBe("allow");
    }
  });

  it("applies visibility for other users", () => {
    expect(decideSetAccess({ ownerId: owner, visibility: "PUBLIC" }, "u", false)).toBe("allow");
    expect(decideSetAccess({ ownerId: owner, visibility: "PRIVATE" }, "u", true)).toBe("not_found");
    expect(decideSetAccess({ ownerId: owner, visibility: "PASSWORD" }, "u", false)).toBe(
      "needs_password",
    );
    expect(decideSetAccess({ ownerId: owner, visibility: "PASSWORD" }, "u", true)).toBe("allow");
  });
});
