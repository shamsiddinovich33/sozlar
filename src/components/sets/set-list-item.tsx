import Link from "next/link";

import { SetMeta } from "@/components/sets/set-meta";
import { VisibilityIcon } from "@/components/sets/visibility-icon";
import type { SetSummary } from "@/types/sets";

export function SetListItem({ set }: { set: SetSummary }) {
  return (
    <li className="animate-in duration-200 fade-in-0 slide-in-from-bottom-1">
      <Link
        href={`/sets/${set.id}`}
        className="group grid gap-2 rounded-xl bg-card p-4 shadow-sm ring-2 ring-transparent transition-all duration-150 hover:ring-brand/60 focus-visible:ring-ring focus-visible:outline-none sm:px-5"
      >
        <SetMeta cardCount={set.cardCount} owner={set.owner} />
        <span className="flex items-center gap-2">
          <span className="truncate text-lg font-semibold group-hover:text-foreground">
            {set.title}
          </span>
          <VisibilityIcon visibility={set.visibility} />
        </span>
      </Link>
    </li>
  );
}
