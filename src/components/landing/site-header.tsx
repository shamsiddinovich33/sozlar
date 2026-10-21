import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Asosiy" className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Kirish</Link>
          </Button>
          <Button asChild variant="cta" className="hidden sm:inline-flex">
            <Link href="/register">Bepul boshlash</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
