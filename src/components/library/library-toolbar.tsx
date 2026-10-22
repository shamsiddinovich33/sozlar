"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { LibrarySort } from "@/lib/validators/library";

const SEARCH_DEBOUNCE_MS = 300;

export function LibraryToolbar({ q, sort }: { q: string; sort: LibrarySort }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const [isPending, startTransition] = useTransition();
  const firstRender = useRef(true);

  function navigate(nextQuery: string, nextSort: LibrarySort) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextSort !== "recent") params.set("sort", nextSort);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => navigate(query, sort), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Only the typed query should trigger a debounced search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="To'plamlarni qidirish"
          aria-label="To'plamlarni qidirish"
          maxLength={100}
          className="pl-9"
        />
        {isPending && (
          <Loader2
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Yuklanmoqda"
          />
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Saralash:
        <select
          value={sort}
          onChange={(e) => navigate(query, e.target.value === "az" ? "az" : "recent")}
          className="h-11 cursor-pointer rounded-lg border-2 border-input bg-secondary px-3 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          <option value="recent">Oxirgi</option>
          <option value="az">A–Z</option>
        </select>
      </label>
    </div>
  );
}
