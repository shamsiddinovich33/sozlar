"use client";

import { useEffect } from "react";

/** Last-resort boundary when the root layout itself fails; must render its own <html>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0A0A2E",
          color: "#F6F7FB",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div role="alert">
          <h1 style={{ fontSize: 24 }}>Nimadir xato ketdi</h1>
          <p style={{ color: "#A8B1CF" }}>Iltimos, sahifani qayta yuklang.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 8,
              border: 0,
              background: "#4255FF",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
