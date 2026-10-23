import { describe, expect, it } from "vitest";

import { describeUserAgent, formatLocation } from "./user-agent";

const UA = {
  chromeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  firefoxMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:131.0) Gecko/20100101 Firefox/131.0",
  yandex:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36",
};

describe("describeUserAgent", () => {
  it.each([
    [UA.chromeWin, "Chrome", "Windows", "desktop"],
    [UA.edge, "Edge", "Windows", "desktop"],
    [UA.iphone, "Safari", "iPhone", "mobile"],
    [UA.android, "Chrome", "Android", "mobile"],
    [UA.androidTablet, "Chrome", "Android", "tablet"],
    [UA.firefoxMac, "Firefox", "macOS", "desktop"],
    [UA.yandex, "Yandex Browser", "Windows", "desktop"],
  ])("%#: %s", (ua, browser, os, kind) => {
    expect(describeUserAgent(ua)).toEqual({ browser, os, kind });
  });

  it("falls back for unknown or missing agents", () => {
    expect(describeUserAgent(null)).toEqual({
      browser: "Noma'lum brauzer",
      os: "Noma'lum tizim",
      kind: "desktop",
    });
  });
});

describe("formatLocation", () => {
  it("decodes the city and joins it with the country", () => {
    expect(formatLocation("Toshkent", "UZ")).toBe("Toshkent, UZ");
    expect(formatLocation("S%C3%A3o%20Paulo", "BR")).toBe("São Paulo, BR");
  });
  it("handles missing parts and bad encoding", () => {
    expect(formatLocation(null, "UZ")).toBe("UZ");
    expect(formatLocation(null, null)).toBeNull();
    expect(formatLocation("%E0%A4%A", null)).toBe("%E0%A4%A");
  });
});
