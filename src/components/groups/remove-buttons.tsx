"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import { removeMember, removeSetFromGroup } from "@/app/(app)/groups/actions";
import { ConfirmDialog } from "@/components/sets/confirm-dialog";
import type { ActionResult } from "@/types/actions";

const ICON_BUTTON =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-error-text focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none";

function RemoveButton({
  label,
  icon,
  title,
  description,
  action,
  success,
}: {
  label: string;
  icon: ReactNode;
  title: string;
  description: string;
  action: () => Promise<ActionResult<null>>;
  success: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className={ICON_BUTTON}
      >
        {icon}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel="Olib tashlash"
        onConfirm={async () => {
          const result = await action();
          if (!result.ok) {
            toast.error(result.error);
            return false;
          }
          toast.success(success);
          router.refresh();
          return true;
        }}
      />
    </>
  );
}

export function RemoveGroupSetButton({
  groupId,
  setId,
  title,
}: {
  groupId: string;
  setId: string;
  title: string;
}) {
  return (
    <RemoveButton
      label={`"${title}" to'plamini guruhdan olib tashlash`}
      icon={<X className="size-4" aria-hidden />}
      title="To'plamni guruhdan olib tashlash"
      description={`"${title}" guruhdan olib tashlanadi. To'plamning o'zi o'chmaydi.`}
      action={() => removeSetFromGroup({ groupId, setId })}
      success="To'plam guruhdan olib tashlandi"
    />
  );
}

export function RemoveMemberButton({
  groupId,
  userId,
  name,
}: {
  groupId: string;
  userId: string;
  name: string;
}) {
  return (
    <RemoveButton
      label={`${name}ni guruhdan chiqarish`}
      icon={<UserMinus className="size-4" aria-hidden />}
      title="A'zoni guruhdan chiqarish"
      description={`${name} guruhdan chiqariladi va u qo'shgan to'plamlar ham olib tashlanadi.`}
      action={() => removeMember({ groupId, userId })}
      success="A'zo guruhdan chiqarildi"
    />
  );
}
