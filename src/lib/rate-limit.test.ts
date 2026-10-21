import { describe, expect, it } from "vitest";

import { createMemoryLimiter, getClientIp } from "./rate-limit";

describe("createMemoryLimiter", () => {
  it("blocks after the limit and resets after the window", async () => {
    let now = 0;
    const limiter = createMemoryLimiter(2, 1000, () => now);

    expect((await limiter.limit("ip")).success).toBe(true);
    expect((await limiter.limit("ip")).success).toBe(true);
    expect((await limiter.limit("ip")).success).toBe(false);
    expect((await limiter.limit("other")).success).toBe(true);

    now = 1000;
    expect((await limiter.limit("ip")).success).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first forwarded address", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
