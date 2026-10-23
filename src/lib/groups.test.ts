import { describe, expect, it } from "vitest";

import { MAX_GROUP_MEMBERS, canJoin, canRemoveGroupSet, groupProgressPercent } from "./groups";

describe("group rules", () => {
  it("lets the owner remove any set and members only their own", () => {
    expect(canRemoveGroupSet("OWNER", "someone", "me")).toBe(true);
    expect(canRemoveGroupSet("MEMBER", "me", "me")).toBe(true);
    expect(canRemoveGroupSet("MEMBER", "someone", "me")).toBe(false);
  });

  it("caps groups at 15 members", () => {
    expect(canJoin(MAX_GROUP_MEMBERS - 1)).toBe(true);
    expect(canJoin(MAX_GROUP_MEMBERS)).toBe(false);
  });

  it("computes progress safely", () => {
    expect(groupProgressPercent(0, 0)).toBe(0);
    expect(groupProgressPercent(3, 8)).toBe(38);
    expect(groupProgressPercent(9, 8)).toBe(100);
  });
});
