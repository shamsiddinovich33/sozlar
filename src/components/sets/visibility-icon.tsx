import { KeyRound, Lock } from "lucide-react";
import type { Visibility } from "@prisma/client";

const LABELS: Record<Visibility, string> = {
  PUBLIC: "Hamma uchun ochiq",
  PASSWORD: "Parol bilan himoyalangan",
  PRIVATE: "Faqat men",
};

/** Lock icon for non-public sets; nothing for public ones. */
export function VisibilityIcon({ visibility }: { visibility: Visibility }) {
  if (visibility === "PUBLIC") return null;
  const Icon = visibility === "PASSWORD" ? KeyRound : Lock;
  return (
    <span title={LABELS[visibility]} className="inline-flex text-muted-foreground">
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{LABELS[visibility]}</span>
    </span>
  );
}
