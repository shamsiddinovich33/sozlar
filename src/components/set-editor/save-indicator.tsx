import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { AutosaveStatus } from "@/hooks/use-autosave";

export function SaveIndicator({
  status,
  onRetry,
}: {
  status: AutosaveStatus;
  onRetry: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="flex h-8 items-center text-sm">
      {status === "saving" && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Saqlanmoqda…
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-success-text">
          <Check className="size-4" aria-hidden />
          Saqlandi
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-error-text">
          <AlertCircle className="size-4" aria-hidden />
          Saqlanmadi.
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-semibold underline underline-offset-2"
          >
            Qayta urinish
          </button>
        </span>
      )}
    </div>
  );
}
