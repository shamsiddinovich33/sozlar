"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/limits";

export function TypedAnswer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Javobni yozing"
        aria-label="Javobingiz"
        maxLength={LIMITS.fieldMax}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className="h-12 text-base"
      />
      <Button type="submit" size="lg" disabled={!value.trim()}>
        Javob berish
      </Button>
    </form>
  );
}
