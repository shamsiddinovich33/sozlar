"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { unlockSet } from "@/app/(app)/sets/study-actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function UnlockForm({ setId, title }: { setId: string; title: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto grid w-full max-w-md gap-6 rounded-2xl bg-card p-6 shadow-lg sm:p-8">
      <div className="grid justify-items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand/15 text-brand-text">
          <KeyRound className="size-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Bu to&apos;plam parol bilan himoyalangan. Ko&apos;rish uchun parolni kiriting.
        </p>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await unlockSet(setId, { password });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="unlock-password">Parol</Label>
          <PasswordInput
            id="unlock-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? "unlock-error" : undefined}
            autoFocus
          />
          {error && (
            <p id="unlock-error" role="alert" className="text-sm text-error-text">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isPending || password === ""}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          Ochish
        </Button>
      </form>
    </div>
  );
}
