"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Layers, Loader2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";

import { addSetsToGroup } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AddableSet } from "@/lib/queries/groups";
import { cn } from "@/lib/utils";

type AddSetsDialogProps = {
  groupId: string;
  sets: AddableSet[];
  /** Visual style of the trigger button */
  variant?: "default" | "secondary";
  label?: string;
};

export function AddSetsDialog({
  groupId,
  sets,
  variant = "secondary",
  label = "To'plam qo'shish",
}: AddSetsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? sets.filter((s) => s.title.toLocaleLowerCase().includes(q)) : sets;
  }, [sets, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function close() {
    setOpen(false);
    setQuery("");
    setSelected(new Set());
  }

  function save() {
    startTransition(async () => {
      const result = await addSetsToGroup({ groupId, setIds: [...selected] });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.added} ta to'plam qo'shildi`);
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !isPending && (next ? setOpen(true) : close())}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>To&apos;plam qo&apos;shish</DialogTitle>
            <DialogDescription>
              O&apos;zingizning to&apos;plamlaringizdan guruhga qo&apos;shmoqchi bo&apos;lganlarini
              tanlang.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="To'plamlaringizni qidiring"
              aria-label="To'plamlaringizni qidiring"
              className="pl-9"
            />
          </div>

          <ul aria-label="To'plamlaringiz" className="grid content-start gap-1 overflow-y-auto">
            {sets.length === 0 ? (
              <li className="grid justify-items-center gap-3 py-8 text-center text-sm text-muted-foreground">
                Sizda hali to&apos;plam yo&apos;q.
                <Button asChild size="sm">
                  <Link href="/sets/new">To&apos;plam yaratish</Link>
                </Button>
              </li>
            ) : visible.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Hech narsa topilmadi
              </li>
            ) : (
              visible.map((set) => {
                const isSelected = selected.has(set.id);
                return (
                  <li key={set.id}>
                    <button
                      type="button"
                      onClick={() => toggle(set.id)}
                      disabled={set.inGroup}
                      aria-pressed={set.inGroup ? undefined : isSelected}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent",
                        isSelected && "bg-accent",
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-text">
                        <Layers className="size-5" aria-hidden />
                      </span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate font-semibold">{set.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {set.cardCount} ta atama
                          {set.inGroup && " · guruhda bor"}
                        </span>
                      </span>
                      {set.inGroup ? (
                        <CheckCircle2 className="size-6 text-muted-foreground" aria-hidden />
                      ) : isSelected ? (
                        <CheckCircle2 className="size-6 text-success-text" aria-hidden />
                      ) : (
                        <PlusCircle className="size-6 text-muted-foreground" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button onClick={save} disabled={selected.size === 0 || isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              Saqlash{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
