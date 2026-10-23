export type DeviceKind = "mobile" | "tablet" | "desktop";

export type DeviceInfo = {
  browser: string;
  os: string;
  kind: DeviceKind;
};

const BROWSERS: [RegExp, string][] = [
  [/YaBrowser\//, "Yandex Browser"],
  [/Edg(A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

/** Readable browser, OS and device kind from a User-Agent header (best effort, no dependencies). */
export function describeUserAgent(userAgent: string | null | undefined): DeviceInfo {
  const ua = userAgent ?? "";
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] ?? "Noma'lum brauzer";
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1] ?? "Noma'lum tizim";
  const kind: DeviceKind =
    /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))
      ? "tablet"
      : /Mobi|iPhone|Android/.test(ua)
        ? "mobile"
        : "desktop";
  return { browser, os, kind };
}

/** "Toshkent, UZ" from Vercel's geo headers (the city is URL-encoded); null when unknown. */
export function formatLocation(city: string | null, country: string | null): string | null {
  let decoded = city;
  if (city) {
    try {
      decoded = decodeURIComponent(city);
    } catch {
      decoded = city;
    }
  }
  const parts = [decoded, country].filter((p): p is string => !!p && p.trim() !== "");
  return parts.length > 0 ? parts.join(", ") : null;
}
