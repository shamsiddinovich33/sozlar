"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorContent({
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
    <div
      role="alert"
      className="mx-auto grid max-w-md justify-items-center gap-5 py-16 text-center"
    >
      <span className="grid size-16 place-items-center rounded-full bg-error/15 text-error-text">
        <AlertTriangle className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">Nimadir xato ketdi</h1>
      <p className="text-muted-foreground">
        Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring.
        {error.digest && <span className="mt-2 block font-mono text-xs">Kod: {error.digest}</span>}
      </p>
      <Button onClick={reset}>Qayta urinish</Button>
    </div>
  );
}
