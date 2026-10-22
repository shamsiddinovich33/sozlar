import { SetListSkeleton } from "@/components/sets/set-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div className="grid gap-6" role="status" aria-label="Yuklanmoqda">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-11 w-full" />
      <SetListSkeleton count={6} />
    </div>
  );
}
