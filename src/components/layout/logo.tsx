import Link from "next/link";

import { LexaMark } from "@/components/brand/lexa-mark";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      <LexaMark className="size-8 text-logo" />
      <span>
        Lexa<span className="sr-only"> — bosh sahifa</span>
      </span>
    </Link>
  );
}
