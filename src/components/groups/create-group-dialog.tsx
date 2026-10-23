"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { createGroup } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GROUP_NAME_MAX } from "@/lib/groups";

export function CreateGroupDialog({ size = "default" }: { size?: "default" | "lg" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Guruh yaratish
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (isPending) return;
          setOpen(next);
          if (!next) {
            setName("");
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O&apos;quv guruhi yaratish</DialogTitle>
            <DialogDescription>
              Kartochkalarni guruh bo&apos;lib o&apos;rganing va bir-biringizning natijalarini
              kuzating.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const result = await createGroup(name);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                router.push(`/groups/${result.data.id}?tab=members`);
              });
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Ingliz tili to'garagi"
              aria-label="Guruh nomi"
              aria-invalid={!!error}
              maxLength={GROUP_NAME_MAX}
              autoFocus
            />
            {error && (
              <p role="alert" className="text-sm text-error-text">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={!name.trim() || isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden />}
                Guruh yaratish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
