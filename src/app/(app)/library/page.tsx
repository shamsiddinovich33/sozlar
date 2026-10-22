import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, SearchX } from "lucide-react";

import { LibraryToolbar } from "@/components/library/library-toolbar";
import { EmptyState } from "@/components/sets/empty-state";
import { SetListItem } from "@/components/sets/set-list-item";
import { Button } from "@/components/ui/button";
import { groupByRecency } from "@/lib/dates";
import { getLibrarySets } from "@/lib/queries/sets";
import { requireUser } from "@/lib/session";
import { librarySearchSchema } from "@/lib/validators/library";
import type { SetSummary } from "@/types/sets";

export const metadata: Metadata = { title: "Kutubxonam" };

type LibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function SetList({ sets }: { sets: SetSummary[] }) {
  return (
    <ul className="grid gap-3">
      {sets.map((set) => (
        <SetListItem key={set.id} set={set} />
      ))}
    </ul>
  );
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const user = await requireUser();
  const search = librarySearchSchema.parse(await searchParams);
  const sets = await getLibrarySets(user.id, search);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Kutubxonam</h1>
      <LibraryToolbar q={search.q ?? ""} sort={search.sort} />

      <p className="sr-only" role="status">
        {sets.length} ta to&apos;plam topildi
      </p>

      {sets.length === 0 ? (
        search.q ? (
          <EmptyState
            icon={SearchX}
            title="Hech narsa topilmadi"
            description={`"${search.q}" bo'yicha to'plam topilmadi. Boshqa so'z bilan qidirib ko'ring.`}
          />
        ) : (
          <EmptyState
            icon={BookOpenText}
            title="Kutubxonangiz bo'sh"
            description="Birinchi to'plamingizni yarating — so'zlarni birma-bir qo'shing yoki import qiling."
            action={
              <Button asChild variant="cta" size="lg">
                <Link href="/sets/new">To&apos;plam yaratish</Link>
              </Button>
            }
          />
        )
      ) : search.sort === "az" ? (
        <SetList sets={sets} />
      ) : (
        groupByRecency(sets, (s) => s.activityAt, new Date()).map((group) => (
          <section
            key={group.bucket}
            aria-labelledby={`group-${group.bucket}`}
            className="grid gap-3"
          >
            <h2
              id={`group-${group.bucket}`}
              className="text-sm font-bold tracking-wider text-muted-foreground uppercase"
            >
              {group.label}
            </h2>
            <SetList sets={group.items} />
          </section>
        ))
      )}
    </div>
  );
}
