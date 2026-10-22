import { describe, expect, it } from "vitest";

import { getRecencyBucket, groupByRecency } from "./dates";

// Wednesday 2026-10-21, 10:00 in Tashkent (UTC+5)
const now = new Date("2026-10-21T05:00:00Z");

describe("getRecencyBucket", () => {
  it("treats the same local day as today", () => {
    expect(getRecencyBucket(new Date("2026-10-20T19:30:00Z"), now)).toBe("today"); // 00:30 local
  });

  it("uses the local time zone at day boundaries", () => {
    expect(getRecencyBucket(new Date("2026-10-20T18:30:00Z"), now)).toBe("thisWeek"); // 23:30 Tue local
  });

  it("puts Monday in this week and Sunday before it in earlier", () => {
    expect(getRecencyBucket(new Date("2026-10-19T07:00:00Z"), now)).toBe("thisWeek");
    expect(getRecencyBucket(new Date("2026-10-18T07:00:00Z"), now)).toBe("earlier");
  });

  it("on Monday, yesterday is already earlier", () => {
    const monday = new Date("2026-10-19T05:00:00Z");
    expect(getRecencyBucket(new Date("2026-10-18T10:00:00Z"), monday)).toBe("earlier");
  });

  it("treats future dates as today", () => {
    expect(getRecencyBucket(new Date("2026-10-22T05:00:00Z"), now)).toBe("today");
  });
});

describe("groupByRecency", () => {
  it("groups in bucket order, keeps item order, and drops empty groups", () => {
    const items = [
      { id: "a", at: new Date("2026-10-21T04:00:00Z") },
      { id: "b", at: new Date("2026-10-01T04:00:00Z") },
      { id: "c", at: new Date("2026-10-21T03:00:00Z") },
    ];
    const groups = groupByRecency(items, (i) => i.at, now);
    expect(groups.map((g) => g.label)).toEqual(["Bugun", "Oldinroq"]);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(["a", "c"]);
  });
});
