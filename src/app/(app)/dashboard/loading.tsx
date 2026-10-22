import { SetListSkeleton } from "@/components/sets/set-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="grid gap-10" role="status" aria-label="Yuklanmoqda">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4">
        <Skeleton className="h-7 w-36" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-[85%] shrink-0 rounded-xl bg-card sm:w-80" />
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-7 w-28" />
        <SetListSkeleton />
      </div>
    </div>
  );
}
