import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="grid gap-8" role="status" aria-label="Yuklanmoqda">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl bg-card" />
        <Skeleton className="h-72 rounded-xl bg-card" />
      </div>
    </div>
  );
}
