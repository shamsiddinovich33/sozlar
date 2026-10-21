import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            So&apos;zlarni oson va samarali yodlash platformasi.
          </p>
        </div>
        <nav aria-label="Pastki" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="#imkoniyatlar" className="text-muted-foreground hover:text-foreground">
            Imkoniyatlar
          </Link>
          <Link href="#qanday-ishlaydi" className="text-muted-foreground hover:text-foreground">
            Qanday ishlaydi
          </Link>
          <Link href="#savollar" className="text-muted-foreground hover:text-foreground">
            Savollar
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Kirish
          </Link>
        </nav>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} So&apos;zlik. Barcha huquqlar himoyalangan.
      </p>
    </footer>
  );
}
