import { AlertCircle } from "lucide-react";

export function FormAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error-text"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
