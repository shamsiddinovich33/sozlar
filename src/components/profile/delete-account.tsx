"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteAccount } from "@/app/(app)/profile/actions";
import { PasswordInput } from "@/components/auth/password-input";
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
import { Label } from "@/components/ui/label";

export function DeleteAccount({
  username,
  hasPassword,
}: {
  username: string;
  hasPassword: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ready = confirmUsername.trim().toLowerCase() === username && (!hasPassword || password);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        Hisobni o&apos;chirish
      </Button>
      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Hisobni o&apos;chirish</DialogTitle>
            <DialogDescription>
              Barcha to&apos;plamlaringiz, kartalaringiz va natijalaringiz butunlay
              o&apos;chiriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const result = await deleteAccount({ confirmUsername, password });
                // On success the action signs out and redirects.
                if (result && !result.ok) setError(result.error);
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="confirm-username">
                Tasdiqlash uchun <span className="font-mono font-bold">{username}</span> deb yozing
              </Label>
              <Input
                id="confirm-username"
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
              />
            </div>
            {hasPassword && (
              <div className="grid gap-2">
                <Label htmlFor="delete-password">Parol</Label>
                <PasswordInput
                  id="delete-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" variant="destructive" disabled={!ready || isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden />}
                Butunlay o&apos;chirish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
