"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FlipCard } from "@/components/flashcard/flip-card";
import { Button } from "@/components/ui/button";

const DEMO_CARDS = [
  { term: "apple", definition: "olma" },
  { term: "journey", definition: "sayohat" },
  { term: "brave", definition: "jasur" },
  { term: "knowledge", definition: "bilim" },
] as const;

/** Landing-page demo card: flips on hover (mouse), click, Enter or Space. */
export function DemoFlashcard() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = DEMO_CARDS[index] ?? DEMO_CARDS[0];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + DEMO_CARDS.length) % DEMO_CARDS.length);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div
        className="w-full"
        onPointerEnter={(e) => e.pointerType === "mouse" && setFlipped(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setFlipped(false)}
      >
        <FlipCard
          className="aspect-[3/2] w-full"
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          backClassName="bg-surface text-white"
          front={
            <>
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Atama
              </span>
              <span className="text-4xl font-bold">{card.term}</span>
            </>
          }
          back={
            <>
              <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                Tarjima
              </span>
              <span className="text-4xl font-bold text-accent-yellow">{card.definition}</span>
            </>
          }
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Oldingi karta">
          <ChevronLeft />
        </Button>
        <span
          className="min-w-12 text-center text-sm text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {index + 1} / {DEMO_CARDS.length}
        </span>
        <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Keyingi karta">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
