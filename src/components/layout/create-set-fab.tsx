"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const FAB_PATHS = ["/dashboard", "/library"];

/** Floating "create set" button, shown on the dashboard and library only. */
export function CreateSetFab() {
  const pathname = usePathname();
  if (!FAB_PATHS.includes(pathname)) return null;
  return (
    <Link
      href="/sets/new"
      aria-label="Yangi to'plam yaratish"
      title="Yangi to'plam"
      className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-accent-yellow text-navy shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-accent-yellow-hover focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none md:right-8 md:bottom-8"
    >
      <Plus className="size-7" aria-hidden />
    </Link>
  );
}
