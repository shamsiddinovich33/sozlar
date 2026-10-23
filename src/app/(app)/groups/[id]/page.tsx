import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Layers } from "lucide-react";

import { AddSetsDialog } from "@/components/groups/add-sets-dialog";
import { GroupMenu } from "@/components/groups/group-menu";
import { InviteBox } from "@/components/groups/invite-box";
import { RemoveGroupSetButton, RemoveMemberButton } from "@/components/groups/remove-buttons";
import { UserAvatar } from "@/components/layout/user-avatar";
import { EmptyState } from "@/components/sets/empty-state";
import { SetMeta } from "@/components/sets/set-meta";
import { VisibilityIcon } from "@/components/sets/visibility-icon";
import { Progress } from "@/components/ui/progress";
import { canRemoveGroupSet } from "@/lib/groups";
import { getAddableSets, getGroupForMember, type GroupDetail } from "@/lib/queries/groups";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { groupIdSchema } from "@/lib/validators/groups";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

async function loadGroup(params: PageProps["params"]) {
  const user = await requireUser();
  const id = groupIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  // Non-members get a 404 so the group's existence isn't revealed.
  const group = await getGroupForMember(id.data, user.id);
  if (!group) notFound();
  return { user, group };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { group } = await loadGroup(params);
  return { title: group.name };
}

const TABS = [
  { id: "materials", label: "Materiallar" },
  { id: "members", label: "A'zolar" },
] as const;

export default async function GroupPage({ params, searchParams }: PageProps) {
  const { user, group } = await loadGroup(params);
  const tabParam = (await searchParams).tab;
  const tab = tabParam === "members" ? "members" : "materials";
  const addable = await getAddableSets(group.id, user.id);

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-bold break-words sm:text-3xl">{group.name}</h1>
        <div className="flex items-center gap-2">
          <AddSetsDialog groupId={group.id} sets={addable} />
          <GroupMenu groupId={group.id} name={group.name} role={group.myRole} />
        </div>
      </header>

      <nav aria-label="Guruh bo'limlari" className="flex gap-6 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/groups/${group.id}${t.id === "members" ? "?tab=members" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
              tab === t.id
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.id === "materials" ? ` (${group.sets.length})` : ` (${group.members.length})`}
          </Link>
        ))}
      </nav>

      {tab === "materials" ? (
        <Materials group={group} userId={user.id} addable={addable} />
      ) : (
        <Members group={group} userId={user.id} />
      )}
    </div>
  );
}

function Materials({
  group,
  userId,
  addable,
}: {
  group: GroupDetail;
  userId: string;
  addable: Awaited<ReturnType<typeof getAddableSets>>;
}) {
  if (group.sets.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Guruhga to'plam qo'shing"
        description="Guruh a'zolari qo'shilgan to'plamlarni ko'rishi va o'rganishi mumkin bo'ladi."
        action={<AddSetsDialog groupId={group.id} sets={addable} variant="default" />}
      />
    );
  }
  return (
    <ul className="grid gap-3">
      {group.sets.map((set) => (
        <li
          key={set.id}
          className="flex items-center gap-2 rounded-xl bg-card p-4 shadow-sm sm:px-5"
        >
          <Link
            href={`/sets/${set.id}`}
            className="grid min-w-0 flex-1 gap-2 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
          >
            <SetMeta cardCount={set.cardCount} owner={set.owner} />
            <span className="flex items-center gap-2">
              <span className="truncate text-lg font-semibold hover:underline">{set.title}</span>
              <VisibilityIcon visibility={set.visibility} />
            </span>
            <span className="text-xs text-muted-foreground">
              Qo&apos;shdi:{" "}
              {set.addedById === userId ? "siz" : (set.addedBy.username ?? set.addedBy.name)}
            </span>
          </Link>
          {canRemoveGroupSet(group.myRole, set.addedById, userId) && (
            <RemoveGroupSetButton groupId={group.id} setId={set.id} title={set.title} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Members({ group, userId }: { group: GroupDetail; userId: string }) {
  return (
    <div className="grid gap-5">
      <InviteBox inviteToken={group.inviteToken} memberCount={group.members.length} />
      <section aria-labelledby="members-title" className="grid gap-3">
        <h2 id="members-title" className="font-bold">
          {group.members.length} a&apos;zo
          {group.totalCards > 0 && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · guruhda {group.totalCards} ta so&apos;z
            </span>
          )}
        </h2>
        <ul className="grid gap-2">
          {group.members.map((m) => {
            const displayName = m.username ?? m.name ?? "—";
            return (
              <li
                key={m.userId}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm"
              >
                <UserAvatar name={m.name ?? m.username} image={m.image} />
                <div className="grid min-w-0 gap-1.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {displayName}
                      {m.userId === userId && (
                        <span className="font-normal text-muted-foreground"> (siz)</span>
                      )}
                    </span>
                    {m.role === "OWNER" && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-yellow/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-accent-yellow">
                        <Crown className="size-3" aria-hidden />
                        Ega
                      </span>
                    )}
                  </span>
                  {group.totalCards > 0 && (
                    <span className="flex items-center gap-3">
                      <Progress
                        value={m.masteredPercent}
                        aria-label={`${displayName}: o'zlashtirilgan so'zlar`}
                        className="max-w-48"
                      />
                      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                        {m.masteredPercent}% · {m.masteredCount}/{group.totalCards}
                      </span>
                    </span>
                  )}
                </div>
                {group.myRole === "OWNER" && m.userId !== userId ? (
                  <RemoveMemberButton groupId={group.id} userId={m.userId} name={displayName} />
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
