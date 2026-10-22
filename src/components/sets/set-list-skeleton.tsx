import { Skeleton } from "@/components/ui/skeleton";

export function SetListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid gap-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="grid gap-3 rounded-xl bg-card p-4 sm:px-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
