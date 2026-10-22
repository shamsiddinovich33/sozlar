import { describe, expect, it } from "vitest";

import { DEFAULT_SET_TITLE } from "@/lib/limits";

import { saveSetSchema, visibilitySchema } from "./set";

const base = { title: "  Fe'llar ", description: "", create: [], update: [], deleteIds: [] };

describe("saveSetSchema", () => {
  it("trims and defaults title and description", () => {
    expect(saveSetSchema.parse(base)).toMatchObject({ title: "Fe'llar", description: null });
    expect(saveSetSchema.parse({ ...base, title: "  " }).title).toBe(DEFAULT_SET_TITLE);
  });

  it("rejects empty card fields and duplicate ids", () => {
    const card = { id: "aaaaaaaa", term: "a", definition: " ", position: 0 };
    expect(saveSetSchema.safeParse({ ...base, create: [card] }).success).toBe(false);
    const ok = { ...card, definition: "b" };
    expect(saveSetSchema.safeParse({ ...base, create: [ok], update: [ok] }).success).toBe(false);
    expect(saveSetSchema.safeParse({ ...base, create: [ok] }).success).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(saveSetSchema.safeParse({ ...base, deleteIds: ["../../x"] }).success).toBe(false);
  });
});

describe("visibilitySchema", () => {
  it("accepts an empty password (keep current) or one of 4+ chars", () => {
    expect(visibilitySchema.safeParse({ visibility: "PASSWORD", password: "" }).success).toBe(true);
    expect(visibilitySchema.safeParse({ visibility: "PASSWORD", password: "abc" }).success).toBe(
      false,
    );
    expect(visibilitySchema.safeParse({ visibility: "PASSWORD", password: "abcd" }).success).toBe(
      true,
    );
    expect(visibilitySchema.safeParse({ visibility: "PUBLIC" }).success).toBe(true);
  });
});
