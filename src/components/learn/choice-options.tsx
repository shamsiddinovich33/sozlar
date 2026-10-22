"use client";

import { Check, X } from "lucide-react";

import type { Choice } from "@/lib/learning";
import { cn } from "@/lib/utils";

type ChoiceOptionsProps = {
  options: Choice[];
  correctIndex: number;
  /** Set once answered */
  feedback: { chosenIndex: number | null; correct: boolean } | null;
  onChoose: (index: number) => void;
};

export function ChoiceOptions({ options, correctIndex, feedback, onChoose }: ChoiceOptionsProps) {
  const answered = feedback !== null;
  return (
    <div role="group" aria-label="Javob variantlari" className="grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => {
        const isCorrect = index === correctIndex;
        const isChosen = feedback?.chosenIndex === index;
        const state = !answered
          ? "idle"
          : isCorrect && feedback.correct
            ? "correct"
            : isChosen
              ? "wrong"
              : isCorrect
                ? "reveal"
                : "dim";
        return (
          <button
            key={option.cardId}
            type="button"
            onClick={() => onChoose(index)}
            disabled={answered}
            aria-keyshortcuts={String(index + 1)}
            className={cn(
              "flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left font-medium transition-all duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-default",
              state === "idle" && "hover:border-brand hover:bg-accent/40",
              state === "correct" && "border-success bg-success/15",
              state === "wrong" && "border-error bg-error/10",
              state === "reveal" && "border-dashed border-success",
              state === "dim" && "opacity-50",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold",
                state === "correct" && "bg-success text-navy",
                state === "wrong" && "bg-error text-navy",
              )}
            >
              {state === "correct" ? (
                <Check className="size-4" />
              ) : state === "wrong" ? (
                <X className="size-4" />
              ) : (
                index + 1
              )}
            </span>
            <span className="break-words">{option.text}</span>
            {(state === "correct" || state === "reveal") && (
              <span className="sr-only"> — to&apos;g&apos;ri javob</span>
            )}
            {state === "wrong" && (
              <span className="sr-only"> — sizning javobingiz, noto&apos;g&apos;ri</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
