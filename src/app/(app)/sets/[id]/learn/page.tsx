import type { Metadata } from "next";
import Link from "next/link";

import { LearnPlayer } from "@/components/learn/learn-player";
import { UnlockForm } from "@/components/sets/unlock-form";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/limits";
import { getSetProgress } from "@/lib/queries/learn";
import { loadSetPage } from "@/lib/queries/viewer-page";
import { requireUser } from "@/lib/session";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await loadSetPage(params);
  return {
    title: result.status === "ok" ? `O'rganish: ${result.set.title}` : "Himoyalangan to'plam",
  };
}

export default async function LearnPage({ params }: PageProps) {
  const result = await loadSetPage(params);
  if (result.status === "needs_password") {
    return <UnlockForm setId={result.set.id} title={result.set.title} />;
  }
  const { set } = result;

  if (set.cards.length < LIMITS.minCardsToStudy) {
    return (
      <div className="mx-auto grid max-w-md justify-items-center gap-4 rounded-2xl bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Kartalar yetarli emas</h1>
        <p className="text-muted-foreground">
          O&apos;rganish uchun to&apos;plamda kamida {LIMITS.minCardsToStudy} ta karta bo&apos;lishi
          kerak.
        </p>
        <Button asChild>
          <Link href={`/sets/${set.id}`}>To&apos;plamga qaytish</Link>
        </Button>
      </div>
    );
  }

  const user = await requireUser();
  const saved = await getSetProgress(set.id, user.id);

  return (
    <>
      <h1 className="sr-only">O&apos;rganish: {set.title}</h1>
      <LearnPlayer
        // Remount when progress changes on the server (e.g. after a reset elsewhere).
        key={set.id}
        setId={set.id}
        title={set.title}
        cards={set.cards.map(({ id, term, definition }) => ({ id, term, definition }))}
        saved={saved}
      />
    </>
  );
}
