import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ db: { user: { findMany } } }));

const { findTakenFields } = await import("./users");

describe("findTakenFields", () => {
  beforeEach(() => findMany.mockReset());

  it("returns nothing when both are free", async () => {
    findMany.mockResolvedValue([]);
    expect(await findTakenFields("a@b.uz", "ali")).toEqual([]);
  });

  it("detects a taken email and username across different users", async () => {
    findMany.mockResolvedValue([
      { email: "a@b.uz", username: "other" },
      { email: "x@y.uz", username: "ali" },
    ]);
    expect(await findTakenFields("a@b.uz", "ali")).toEqual(["email", "username"]);
  });

  it("detects only the taken field", async () => {
    findMany.mockResolvedValue([{ email: "x@y.uz", username: "ali" }]);
    expect(await findTakenFields("a@b.uz", "ali")).toEqual(["username"]);
  });
});
