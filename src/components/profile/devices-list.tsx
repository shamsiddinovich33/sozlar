"use client";

import { useState, useTransition } from "react";
import { Loader2, LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";

import { revokeDevice, revokeOtherDevices } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeviceKind } from "@/lib/user-agent";

export type DeviceItem = {
  id: string;
  title: string;
  kind: DeviceKind;
  location: string | null;
  signedIn: string;
  lastSeen: string;
  current: boolean;
};

const ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor } as const;

export function DevicesList({
  devices,
  currentTracked,
}: {
  devices: DeviceItem[];
  /** False for a sign-in made before devices were tracked (it is not in the list). */
  currentTracked: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const others = devices.filter((d) => !d.current);

  function revoke(device: DeviceItem) {
    setPendingId(device.id);
    startTransition(async () => {
      const result = await revokeDevice({ id: device.id });
      setPendingId(null);
      if (result.ok) toast.success(`${device.title} qurilmasi chiqarildi`);
      else toast.error(result.error);
    });
  }

  function revokeAll() {
    startTransition(async () => {
      const result = await revokeOtherDevices();
      setConfirmOpen(false);
      if (result.ok) toast.success(`${result.data} ta qurilma chiqarildi`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-4">
      {!currentTracked && (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Bu qurilma ro&apos;yxatda ko&apos;rinishi uchun bir marta chiqib, qaytadan kiring.
        </p>
      )}

      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha qurilmalar yo&apos;q.</p>
      ) : (
        <ul className="grid divide-y divide-border/60" aria-label="Kirilgan qurilmalar">
          {devices.map((device) => {
            const Icon = ICONS[device.kind];
            return (
              <li key={device.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                    <span className="truncate">{device.title}</span>
                    {device.current && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success-text">
                        Shu qurilma
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      device.location,
                      device.current ? "Hozir faol" : `Oxirgi faollik: ${device.lastSeen}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground">Kirilgan: {device.signedIn}</p>
                </div>
                {!device.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revoke(device)}
                    disabled={isPending}
                    aria-label={`${device.title} qurilmasini chiqarish`}
                  >
                    {pendingId === device.id ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <LogOut aria-hidden />
                    )}
                    <span className="max-sm:sr-only">Chiqarish</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {currentTracked && others.length > 0 && (
        <div>
          <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={isPending}>
            <LogOut aria-hidden />
            Boshqa barcha qurilmalardan chiqish
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !isPending && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boshqa qurilmalardan chiqilsinmi?</DialogTitle>
            <DialogDescription>
              {others.length} ta qurilma akkauntdan chiqariladi. Shu qurilmada esa kirgan holda
              qolasiz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={revokeAll} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              Chiqarish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
