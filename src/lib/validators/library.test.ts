import { describe, expect, it } from "vitest";

import { librarySearchSchema } from "./library";

describe("librarySearchSchema", () => {
  it("applies defaults", () => {
    expect(librarySearchSchema.parse({})).toEqual({ q: undefined, sort: "recent" });
  });

  it("trims the query and keeps a valid sort", () => {
    expect(librarySearchSchema.parse({ q: "  fe'llar ", sort: "az" })).toEqual({
      q: "fe'llar",
      sort: "az",
    });
  });

  it("falls back on invalid values", () => {
    expect(librarySearchSchema.parse({ q: ["a", "b"], sort: "oldest" })).toEqual({
      q: undefined,
      sort: "recent",
    });
    expect(librarySearchSchema.parse({ q: "   " }).q).toBeUndefined();
  });
});
