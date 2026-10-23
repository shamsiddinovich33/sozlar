import type { Metadata } from "next";
import Link from "next/link";
import { Crown, UsersRound } from "lucide-react";

import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { getUserGroups } from "@/lib/queries/groups";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "O'quv guruhlari" };

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await getUserGroups(user.id);

  if (groups.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <h1 className="text-2xl font-bold sm:text-3xl">O&apos;quv guruhlari</h1>
        <section className="mx-auto grid max-w-md justify-items-center gap-5 py-12 text-center">
          <span className="grid size-24 place-items-center rounded-3xl bg-brand/15 text-brand-text">
            <UsersRound className="size-12" aria-hidden />
          </span>
          <h2 className="text-xl font-bold text-balance sm:text-2xl">
            O&apos;quv guruhingizni yarating va kartochkalarni birga o&apos;rganing
          </h2>
          <p className="text-muted-foreground">
            To&apos;plamlarni guruhga qo&apos;shing, do&apos;stlaringizni havola orqali taklif
            qiling va bir-biringizning natijalarini kuzating.
          </p>
          <CreateGroupDialog size="lg" />
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">O&apos;quv guruhlari</h1>
        <CreateGroupDialog />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <li key={group.id} className="animate-in duration-200 fade-in-0 slide-in-from-bottom-1">
            <Link
              href={`/groups/${group.id}`}
              className="grid gap-2 rounded-xl bg-card p-5 shadow-sm ring-2 ring-transparent transition-all duration-150 hover:ring-brand/60 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold">{group.name}</span>
                {group.role === "OWNER" && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-yellow/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-accent-yellow">
                    <Crown className="size-3" aria-hidden />
                    Ega
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                {group.memberCount} a&apos;zo · {group.setCount} ta to&apos;plam
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
