import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { UsersRound } from "lucide-react";

import { JoinGroupButton } from "@/components/groups/join-group-button";
import { MAX_GROUP_MEMBERS, canJoin } from "@/lib/groups";
import { getGroupByInvite } from "@/lib/queries/groups";
import { requireUser } from "@/lib/session";
import { inviteTokenSchema } from "@/lib/validators/groups";

export const metadata: Metadata = { title: "Guruhga taklif" };

export default async function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const user = await requireUser();
  const token = inviteTokenSchema.safeParse((await params).token);
  if (!token.success) notFound();
  const group = await getGroupByInvite(token.data, user.id);
  if (!group) notFound();
  if (group.isMember) redirect(`/groups/${group.id}`);

  return (
    <div className="mx-auto grid w-full max-w-md justify-items-center gap-5 rounded-2xl bg-card p-8 text-center shadow-lg">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand/15 text-brand-text">
        <UsersRound className="size-8" aria-hidden />
      </span>
      <div className="grid gap-1.5">
        <p className="text-sm text-muted-foreground">
          {group.ownerName} sizni o&apos;quv guruhiga taklif qildi
        </p>
        <h1 className="text-2xl font-bold break-words">{group.name}</h1>
        <p className="text-sm text-muted-foreground">
          {group.memberCount} a&apos;zo · {group.setCount} ta to&apos;plam
        </p>
      </div>
      {canJoin(group.memberCount) ? (
        <>
          <p className="text-sm text-muted-foreground">
            Qo&apos;shilganingizdan keyin guruh a&apos;zolari sizning ismingiz va natijalaringizni
            ko&apos;radi.
          </p>
          <JoinGroupButton token={token.data} />
        </>
      ) : (
        <p role="alert" className="text-error-text">
          Guruh to&apos;lgan (ko&apos;pi bilan {MAX_GROUP_MEMBERS} a&apos;zo).
        </p>
      )}
    </div>
  );
}
