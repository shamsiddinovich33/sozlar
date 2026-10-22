"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { changePassword } from "@/app/(app)/profile/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/lib/validators/profile";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const parsed = changePasswordSchema.safeParse({ currentPassword: current, newPassword: next });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
      return;
    }
    if (next !== confirm) {
      setError("Parollar mos kelmadi");
      return;
    }
    startTransition(async () => {
      const result = await changePassword(parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(hasPassword ? "Parol o'zgartirildi" : "Parol o'rnatildi");
    });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      {!hasPassword && (
        <p className="text-sm text-muted-foreground">
          Siz Google orqali kirgansiz. Email va parol bilan ham kirish uchun parol o&apos;rnating.
        </p>
      )}
      <FormAlert message={error} />
      {hasPassword && (
        <div className="grid gap-2">
          <Label htmlFor="current-password">Joriy parol</Label>
          <PasswordInput
            id="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="new-password">Yangi parol</Label>
        <PasswordInput
          id="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          aria-describedby="new-password-hint"
        />
        <p id="new-password-hint" className="text-sm text-muted-foreground">
          Kamida 8 ta belgi
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Yangi parolni takrorlang</Label>
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Button type="submit" disabled={isPending || !next}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          {hasPassword ? "Parolni o'zgartirish" : "Parol o'rnatish"}
        </Button>
      </div>
    </form>
  );
}
