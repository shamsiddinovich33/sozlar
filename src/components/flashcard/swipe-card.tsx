"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";

const SWIPE_THRESHOLD = 110;

type SwipeCardProps = {
  disabled: boolean;
  onSwipe: (direction: "right" | "left") => void;
  onDragStart: () => void;
  /** Receives a guard that returns true right after a drag, so the drag doesn't count as a click. */
  children: (wasDragged: () => boolean) => ReactNode;
};

/** Horizontal swipe wrapper with "Bilaman" / "Bilmayman" hints. Each card gets its own offset. */
export function SwipeCard({ disabled, onSwipe, onDragStart, children }: SwipeCardProps) {
  const x = useMotionValue(0);
  const knownOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const unknownOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const draggedRef = useRef(false);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) onSwipe(info.offset.x > 0 ? "right" : "left");
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  return (
    <motion.div
      drag={disabled ? false : "x"}
      dragSnapToOrigin
      dragElastic={0.7}
      style={{ x }}
      onDragStart={() => {
        draggedRef.current = true;
        onDragStart();
      }}
      onDragEnd={handleDragEnd}
      className="relative touch-pan-y"
    >
      {children(() => draggedRef.current)}
      <motion.span
        aria-hidden
        style={{ opacity: knownOpacity }}
        className="pointer-events-none absolute top-4 left-4 rounded-lg border-2 border-success px-3 py-1 font-bold text-success"
      >
        Bilaman
      </motion.span>
      <motion.span
        aria-hidden
        style={{ opacity: unknownOpacity }}
        className="pointer-events-none absolute top-4 right-28 rounded-lg border-2 border-error px-3 py-1 font-bold text-error"
      >
        Bilmayman
      </motion.span>
    </motion.div>
  );
}
