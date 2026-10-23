"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hintMask, maxHintLevel } from "@/lib/learning";
import { LIMITS } from "@/lib/limits";

type TypedAnswerProps = {
  /** Expected answer (used only to build the hint mask) */
  answer: string;
  hintLevel: number;
  onHint: () => void;
  onSubmit: (text: string) => void;
  onDontKnow: () => void;
};

/** "Javobingiz" field with Ko'rsatma (hint), Bilmayman? and Javob berish, Quizlet-style. */
export function TypedAnswer({ answer, hintLevel, onHint, onSubmit, onDontKnow }: TypedAnswerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();
  const maxHint = maxHintLevel(answer);
  const mask = hintLevel > 0 ? hintMask(answer, hintLevel) : null;
  const revealed = mask
    ? mask
        .filter((ch) => ch !== "_")
        .join("")
        .replace(/\s+/g, " ")
    : "";
  const letters = mask ? mask.filter((ch) => /[\p{L}\p{N}_]/u.test(ch)).length : 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
    >
      {mask && (
        <p id={hintId} className="grid gap-1" aria-live="polite">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Ko&apos;rsatma
          </span>
          <span aria-hidden className="flex flex-wrap gap-x-1.5 font-mono text-xl font-semibold">
            {mask.map((ch, i) =>
              ch === " " ? (
                <span key={i} className="w-3" />
              ) : (
                <span key={i} className={ch === "_" ? "text-muted-foreground" : "text-brand-text"}>
                  {ch}
                </span>
              ),
            )}
          </span>
          <span className="sr-only">
            Javob {letters} ta harfdan iborat, boshlanishi: {revealed}
          </span>
        </p>
      )}

      <div className="grid gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold">
          Javobingiz
        </label>
        <Input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Javobni yozing"
          maxLength={LIMITS.fieldMax}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={mask ? hintId : undefined}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onHint();
            inputRef.current?.focus();
          }}
          disabled={hintLevel >= maxHint}
          className="-ml-3"
        >
          <Lightbulb aria-hidden />
          Ko&apos;rsatma
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onDontKnow} className="text-brand-text">
            Bilmayman?
          </Button>
          <Button type="submit" disabled={!value.trim()}>
            Javob berish
          </Button>
        </div>
      </div>
    </form>
  );
}
