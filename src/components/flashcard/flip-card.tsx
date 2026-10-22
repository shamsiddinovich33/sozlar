"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
  /** Screen-reader prefix per side, e.g. "Atama" / "Tarjima" */
  frontLabel?: string;
  backLabel?: string;
  className?: string;
  backClassName?: string;
  /** Rendered on top of the card (not flipped), e.g. speaker and star buttons */
  toolbar?: ReactNode;
};

const FACE =
  "absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl bg-card p-6 text-center shadow-xl ring-1 ring-border [backface-visibility:hidden]";

/** 3D flip card; click, Enter or Space flips. Falls back to a cross-fade with reduced motion. */
export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  frontLabel,
  backLabel,
  className,
  backClassName,
  toolbar,
}: FlipCardProps) {
  const reduceMotion = useReducedMotion();
  const hintId = useId();
  return (
    <div className={cn("relative [perspective:1400px]", className)}>
      <motion.button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-describedby={hintId}
        className="relative block size-full cursor-pointer rounded-2xl [transform-style:preserve-3d] focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none"
        initial={false}
        animate={reduceMotion ? { rotateY: 0 } : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <span
          className={FACE}
          aria-hidden={flipped}
          style={reduceMotion && flipped ? { visibility: "hidden" } : undefined}
        >
          {frontLabel && <span className="sr-only">{frontLabel}: </span>}
          {front}
        </span>
        <span
          className={cn(FACE, backClassName)}
          aria-hidden={!flipped}
          style={
            reduceMotion
              ? { visibility: flipped ? "visible" : "hidden" }
              : { transform: "rotateY(180deg)" }
          }
        >
          {backLabel && <span className="sr-only">{backLabel}: </span>}
          {back}
        </span>
      </motion.button>
      <span id={hintId} className="sr-only">
        Aylantirish uchun bosing yoki Probel tugmasini bosing
      </span>
      {toolbar && <div className="absolute top-3 right-3 z-10 flex gap-1">{toolbar}</div>}
    </div>
  );
}

/** Large centered text that shrinks for long content. */
export function CardFaceText({ text }: { text: string }) {
  const size =
    text.length > 120 ? "text-lg" : text.length > 50 ? "text-2xl" : "text-3xl sm:text-4xl";
  return <span className={cn("font-semibold break-words whitespace-pre-wrap", size)}>{text}</span>;
}
