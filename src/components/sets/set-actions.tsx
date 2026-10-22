"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, RotateCcw, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Visibility } from "@prisma/client";

import { deleteSet, resetProgress } from "@/app/(app)/sets/study-actions";
import { ConfirmDialog } from "@/components/sets/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SetActionsProps = { setId: string; title: string; isOwner: boolean; visibility: Visibility };

export function SetActions({ setId, title, isOwner, visibility }: SetActionsProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"delete" | "reset" | null>(null);

  async function share() {
    const url = `${window.location.origin}/sets/${setId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        visibility === "PRIVATE"
          ? "Havola nusxalandi. Eslatma: to'plam hozir faqat sizga ko'rinadi"
          : "Havola nusxalandi",
      );
    } catch {
      toast.error("Havolani nusxalab bo'lmadi");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => void share()}>
        <Share2 aria-hidden />
        Ulashish
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Boshqa amallar">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isOwner && (
            <DropdownMenuItem asChild>
              <Link href={`/sets/${setId}/edit`}>
                <Pencil aria-hidden />
                Tahrirlash
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setConfirm("reset")}>
            <RotateCcw aria-hidden />
            Progressni tiklash
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                <Trash2 aria-hidden />
                O&apos;chirish
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === "reset"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Progressni tiklash"
        description="Bu to'plamdagi barcha so'zlar bo'yicha natijalaringiz o'chiriladi. Davom etasizmi?"
        confirmLabel="Tiklash"
        onConfirm={async () => {
          const result = await resetProgress(setId);
          if (!result.ok) {
            toast.error(result.error);
            return false;
          }
          toast.success("Progress tiklandi");
          router.refresh();
          return true;
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="To'plamni o'chirish"
        description={`"${title}" va undagi barcha kartalar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`}
        confirmLabel="O'chirish"
        onConfirm={async () => {
          const result = await deleteSet(setId);
          if (!result.ok) {
            toast.error(result.error);
            return false;
          }
          toast.success("To'plam o'chirildi");
          router.replace("/library");
          return true;
        }}
      />
    </div>
  );
}
