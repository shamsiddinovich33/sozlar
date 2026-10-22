import { UserAvatar } from "@/components/layout/user-avatar";
import type { SetOwner } from "@/types/sets";

function termCountLabel(count: number): string {
  return `${count} ta atama`;
}

export function SetMeta({ cardCount, owner }: { cardCount: number; owner: SetOwner }) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
        {termCountLabel(cardCount)}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <UserAvatar
          name={owner.name}
          image={owner.image}
          className="size-5"
          fallbackClassName="text-[8px]"
        />
        <span className="truncate">{owner.username ?? owner.name}</span>
      </span>
    </div>
  );
}
