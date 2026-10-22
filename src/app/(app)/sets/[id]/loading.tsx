import { Skeleton } from "@/components/ui/skeleton";

export default function SetLoading() {
  return (
    <div className="grid gap-8" role="status" aria-label="Yuklanmoqda">
      <div className="grid gap-3">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Skeleton className="h-14 bg-card" />
          <Skeleton className="h-14 bg-card" />
        </div>
      </div>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-card sm:aspect-[16/9]" />
      <div className="grid gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 bg-card" />
        ))}
      </div>
    </div>
  );
}
