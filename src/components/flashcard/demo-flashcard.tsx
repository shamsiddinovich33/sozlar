"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEMO_CARDS = [
  { term: "apple", definition: "olma" },
  { term: "journey", definition: "sayohat" },
  { term: "brave", definition: "jasur" },
  { term: "knowledge", definition: "bilim" },
] as const;

/** Landing-page demo card: flips on hover (pointer devices), click, Enter or Space. */
export function DemoFlashcard() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const card = DEMO_CARDS[index] ?? DEMO_CARDS[0];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + DEMO_CARDS.length) % DEMO_CARDS.length);
  }

  const faceClass =
    "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border [backface-visibility:hidden]";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="w-full [perspective:1200px]">
        <motion.button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          onHoverStart={(e) => {
            if ((e as PointerEvent).pointerType === "mouse") setFlipped(true);
          }}
          onHoverEnd={(e) => {
            if ((e as PointerEvent).pointerType === "mouse") setFlipped(false);
          }}
          aria-pressed={flipped}
          aria-label={`Namuna karta: ${flipped ? card.definition : card.term}. Aylantirish uchun bosing`}
          className="relative block aspect-[3/2] w-full cursor-pointer rounded-2xl [transform-style:preserve-3d] focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none"
          animate={reduceMotion ? { opacity: 1 } : { rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          <span
            className={faceClass}
            style={reduceMotion && flipped ? { visibility: "hidden" } : undefined}
          >
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Atama
            </span>
            <span className="text-4xl font-bold">{card.term}</span>
          </span>
          <span
            className={cn(faceClass, "bg-surface text-white")}
            style={
              reduceMotion
                ? { visibility: flipped ? "visible" : "hidden" }
                : { transform: "rotateY(180deg)" }
            }
          >
            <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              Tarjima
            </span>
            <span className="text-4xl font-bold text-accent-yellow">{card.definition}</span>
          </span>
        </motion.button>
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
