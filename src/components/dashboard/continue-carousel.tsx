"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SetMeta } from "@/components/sets/set-meta";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ContinueSet } from "@/types/sets";

export function ContinueCarousel({ sets }: { sets: ContinueSet[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 hidden gap-2 sm:flex">
        <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Oldingilari">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Keyingilari">
          <ChevronRight />
        </Button>
      </div>
      <ul
        ref={scrollerRef}
        tabIndex={0}
        aria-label="Davom ettirish uchun to'plamlar"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-2 focus-visible:outline-none sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {sets.map((set) => (
          <li
            key={set.id}
            className="flex w-[85%] shrink-0 snap-start flex-col gap-4 rounded-xl bg-card p-5 shadow-sm sm:w-80"
          >
            <div className="grid gap-2">
              <Link
                href={`/sets/${set.id}`}
                className="truncate text-lg font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {set.title}
              </Link>
              <SetMeta cardCount={set.cardCount} owner={set.owner} />
            </div>
            <div className="grid gap-1.5">
              <Progress value={set.masteredPercent} aria-label={`${set.title}: o'zlashtirilgan`} />
              <span className="text-xs text-muted-foreground">
                {set.masteredPercent}% o&apos;zlashtirildi · {set.masteredCount}/{set.cardCount}
              </span>
            </div>
            <Button asChild className="mt-auto w-full">
              <Link href={`/sets/${set.id}/learn`}>Davom etish</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
