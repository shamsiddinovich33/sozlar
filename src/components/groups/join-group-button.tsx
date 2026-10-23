"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { joinGroup } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";

export function JoinGroupButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return (
    <div className="grid justify-items-center gap-3">
      <Button
        variant="cta"
        size="lg"
        disabled={isPending}
        autoFocus
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await joinGroup(token);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.replace(`/groups/${result.data.id}`);
          })
        }
      >
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        Guruhga qo&apos;shilish
      </Button>
      {error && (
        <p role="alert" className="text-sm text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
