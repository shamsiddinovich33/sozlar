"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, LogOut, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { GroupRole } from "@prisma/client";

import { deleteGroup, leaveGroup, regenerateInvite, renameGroup } from "@/app/(app)/groups/actions";
import { ConfirmDialog } from "@/components/sets/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { GROUP_NAME_MAX } from "@/lib/groups";
import type { ActionResult } from "@/types/actions";

type Dialogs = "rename" | "regenerate" | "delete" | "leave" | null;

export function GroupMenu({
  groupId,
  name,
  role,
}: {
  groupId: string;
  name: string;
  role: GroupRole;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [newName, setNewName] = useState(name);
  const [isPending, startTransition] = useTransition();
  const isOwner = role === "OWNER";

  async function run(action: () => Promise<ActionResult<null>>, success: string, goTo?: string) {
    const result = await action();
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    toast.success(success);
    if (goTo) router.replace(goTo);
    else router.refresh();
    return true;
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Guruh amallari">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {isOwner ? (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setNewName(name);
                  setDialog("rename");
                }}
              >
                <Pencil aria-hidden />
                Nomini o&apos;zgartirish
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("regenerate")}>
                <RefreshCw aria-hidden />
                Taklif havolasini yangilash
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
                <Trash2 aria-hidden />
                Guruhni o&apos;chirish
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => setDialog("leave")}>
              <LogOut aria-hidden />
              Guruhdan chiqish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialog === "rename"}
        onOpenChange={(open) => !open && !isPending && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guruh nomini o&apos;zgartirish</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                if (await run(() => renameGroup(groupId, newName), "Nom saqlandi")) setDialog(null);
              });
            }}
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="Guruh nomi"
              maxLength={GROUP_NAME_MAX}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={!newName.trim() || isPending}>
                Saqlash
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dialog === "regenerate"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Taklif havolasini yangilash"
        description="Eski havola ishlamay qoladi. Guruhdagi a'zolar o'z joyida qoladi."
        confirmLabel="Yangilash"
        onConfirm={() => run(() => regenerateInvite(groupId), "Yangi havola tayyor")}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Guruhni o'chirish"
        description={`"${name}" guruhi barcha a'zolar uchun o'chiriladi. To'plamlarning o'zi o'chmaydi.`}
        confirmLabel="O'chirish"
        onConfirm={() => run(() => deleteGroup(groupId), "Guruh o'chirildi", "/groups")}
      />
      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Guruhdan chiqish"
        description="Siz qo'shgan to'plamlar ham guruhdan olib tashlanadi."
        confirmLabel="Chiqish"
        onConfirm={() => run(() => leaveGroup(groupId), "Guruhdan chiqdingiz", "/groups")}
      />
    </>
  );
}
