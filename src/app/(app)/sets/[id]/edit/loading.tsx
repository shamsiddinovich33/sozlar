import { Skeleton } from "@/components/ui/skeleton";

export default function EditSetLoading() {
  return (
    <div className="grid gap-6" role="status" aria-label="Yuklanmoqda">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-12 w-28" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-20 w-full" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl bg-card" />
      ))}
    </div>
  );
}
