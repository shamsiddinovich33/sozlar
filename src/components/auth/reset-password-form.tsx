"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { resetPassword } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validators/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
      return;
    }
    if (password !== confirm) {
      setError("Parollar mos kelmadi");
      return;
    }
    startTransition(async () => {
      const result = await resetPassword(parsed.data);
      if (!result.ok) {
        setError(result.formError);
        return;
      }
      router.replace("/login?reset=1");
    });
  }

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FormAlert message={error} />
      <div className="grid gap-2">
        <Label htmlFor="reset-password">Yangi parol</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Kamida 8 ta belgi</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reset-confirm">Yangi parolni takrorlang</Label>
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending || !password}>
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        Parolni saqlash
      </Button>
    </form>
  );
}
