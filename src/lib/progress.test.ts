import { describe, expect, it } from "vitest";

import { masteryPercent } from "./progress";

describe("masteryPercent", () => {
  it("rounds to whole percents", () => {
    expect(masteryPercent(1, 3)).toBe(33);
    expect(masteryPercent(2, 3)).toBe(67);
  });

  it("handles empty and full sets", () => {
    expect(masteryPercent(0, 0)).toBe(0);
    expect(masteryPercent(30, 30)).toBe(100);
  });
});
