import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundContent({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-5 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand/15 text-brand-text">
        <SearchX className="size-8" aria-hidden />
      </span>
      <p className="text-5xl font-extrabold text-brand-text">404</p>
      <h1 className="text-2xl font-bold">Sahifa topilmadi</h1>
      <p className="text-muted-foreground">
        Siz qidirgan sahifa mavjud emas, o&apos;chirilgan yoki uni ko&apos;rishga ruxsatingiz
        yo&apos;q.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="cta">
          <Link href={signedIn ? "/dashboard" : "/"}>Bosh sahifa</Link>
        </Button>
        {signedIn && (
          <Button asChild variant="outline">
            <Link href="/library">Kutubxonam</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
