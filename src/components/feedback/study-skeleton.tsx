import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for Flashcards / Learn while the set loads. */
export function StudySkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6" role="status" aria-label="Yuklanmoqda">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-card sm:aspect-[16/9]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
