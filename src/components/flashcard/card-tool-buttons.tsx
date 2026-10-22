"use client";

import { Star, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

const BUTTON =
  "grid size-10 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none";

export function SpeakButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={BUTTON}>
      <Volume2 className="size-5" aria-hidden />
    </button>
  );
}

export function StarButton({ starred, onClick }: { starred: boolean; onClick: () => void }) {
  const label = starred ? "Yulduzchani olib tashlash" : "Yulduzcha qo'yish";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={starred}
      title={label}
      className={cn(BUTTON, starred && "text-accent-yellow hover:text-accent-yellow")}
    >
      <Star className={cn("size-5", starred && "fill-current")} aria-hidden />
    </button>
  );
}
