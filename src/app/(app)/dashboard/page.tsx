import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { ContinueCarousel } from "@/components/dashboard/continue-carousel";
import { EmptyState } from "@/components/sets/empty-state";
import { SetListItem } from "@/components/sets/set-list-item";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { getContinueSets, getRecentSets } from "@/lib/queries/sets";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [continueSets, recentSets] = await Promise.all([
    getContinueSets(user.id),
    getRecentSets(user.id),
  ]);
  const firstName = user.name?.split(" ")[0] ?? user.username;

  return (
    <div className="grid grid-cols-1 gap-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Salom, {firstName}!</h1>

      {continueSets.length > 0 && (
        <section aria-labelledby="continue-title" className="grid grid-cols-1 gap-4">
          <h2 id="continue-title" className="flex h-10 items-center text-lg font-bold">
            Davom etish
          </h2>
          <ContinueCarousel sets={continueSets} />
        </section>
      )}

      <section aria-labelledby="recent-title" className="grid gap-4">
        <h2 id="recent-title" className="text-lg font-bold">
          Oxirgilar
        </h2>
        {recentSets.length > 0 ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {recentSets.map((set) => (
              <SetListItem key={set.id} set={set} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={BookOpenText}
            title="Hali to'plamlaringiz yo'q"
            description="So'zlarni qo'shing yoki ro'yxatni import qiling va o'rganishni boshlang."
            action={
              <Button asChild variant="cta" size="lg">
                <Link href="/sets/new">Birinchi to&apos;plamingizni yarating</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
