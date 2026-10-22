import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 rounded-lg text-xl font-extrabold", className)}
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-brand text-base text-white"
      >
        S
      </span>
      <span>
        So&apos;zlik<span className="sr-only"> — bosh sahifa</span>
      </span>
    </Link>
  );
}
