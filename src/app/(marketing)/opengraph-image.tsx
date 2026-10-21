import { ImageResponse } from "next/og";

export const alt = "So'zlik — xorijiy so'zlarni oson yodlang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0A0A2E",
        color: "#F6F7FB",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#4255FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 56, fontWeight: 800 }}>So&apos;zlik</div>
      </div>
      <div style={{ marginTop: 48, fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>
        So&apos;zlarni tezroq va mustahkam yodlang
      </div>
      <div style={{ marginTop: 28, fontSize: 32, color: "#A8B1CF" }}>
        Flashcards · Aqlli o&apos;rganish · Ommaviy import
      </div>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          height: 12,
          width: 360,
          borderRadius: 6,
          background: "#FFCD1F",
        }}
      />
    </div>,
    size,
  );
}
