import { describe, expect, it } from "vitest";

import { addGroupSetsSchema, groupNameSchema, inviteTokenSchema } from "./groups";

describe("group validators", () => {
  it("trims names and rejects empty or long ones", () => {
    expect(groupNameSchema.parse("  Ingliz tili ")).toBe("Ingliz tili");
    expect(groupNameSchema.safeParse("   ").success).toBe(false);
    expect(groupNameSchema.safeParse("x".repeat(61)).success).toBe(false);
  });

  it("accepts only well-formed invite tokens", () => {
    expect(inviteTokenSchema.safeParse("a".repeat(43)).success).toBe(true);
    expect(inviteTokenSchema.safeParse("short").success).toBe(false);
    expect(inviteTokenSchema.safeParse(`${"a".repeat(40)}/..`).success).toBe(false);
  });

  it("requires at least one set", () => {
    expect(addGroupSetsSchema.safeParse({ groupId: "aaaaaaaa", setIds: [] }).success).toBe(false);
  });
});
