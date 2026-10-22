import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, Layers } from "lucide-react";

import { UserAvatar } from "@/components/layout/user-avatar";
import { SetActions } from "@/components/sets/set-actions";
import { SetStudyView } from "@/components/sets/set-study-view";
import { UnlockForm } from "@/components/sets/unlock-form";
import { VisibilityIcon } from "@/components/sets/visibility-icon";
import { LIMITS } from "@/lib/limits";
import { loadSetPage } from "@/lib/queries/viewer-page";
import { cn } from "@/lib/utils";

type SetPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: SetPageProps): Promise<Metadata> {
  const result = await loadSetPage(params);
  return { title: result.status === "ok" ? result.set.title : "Himoyalangan to'plam" };
}

const MODES = [
  { slug: "flashcards", label: "Flashcards", icon: Layers },
  { slug: "learn", label: "O'rganish", icon: BrainCircuit },
] as const;

export default async function SetPage({ params }: SetPageProps) {
  const result = await loadSetPage(params);
  if (result.status === "needs_password") {
    return <UnlockForm setId={result.set.id} title={result.set.title} />;
  }

  const { set } = result;
  const canStudy = set.cards.length >= LIMITS.minCardsToStudy;

  return (
    <div className="grid grid-cols-1 gap-8">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid min-w-0 gap-2">
            <h1 className="flex items-center gap-2 text-2xl font-bold break-words sm:text-3xl">
              {set.title}
              <VisibilityIcon visibility={set.visibility} />
            </h1>
            {set.description && (
              <p className="whitespace-pre-wrap text-muted-foreground">{set.description}</p>
            )}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar
                name={set.owner.name}
                image={set.owner.image}
                className="size-6"
                fallbackClassName="text-[10px]"
              />
              <span>{set.owner.username ?? set.owner.name}</span>
              <span aria-hidden>·</span>
              <span>{set.cards.length} ta atama</span>
            </p>
          </div>
          <SetActions
            setId={set.id}
            title={set.title}
            isOwner={set.isOwner}
            visibility={set.visibility}
          />
        </div>

        <nav aria-label="O'qish rejimlari" className="grid grid-cols-2 gap-3 sm:max-w-md">
          {MODES.map(({ slug, label, icon: Icon }) => {
            const className = cn(
              "flex items-center justify-center gap-2 rounded-xl bg-card px-4 py-4 font-semibold shadow-sm ring-2 ring-transparent transition-all",
              canStudy
                ? "hover:ring-brand/60 focus-visible:ring-ring focus-visible:outline-none"
                : "cursor-not-allowed opacity-50",
            );
            const content = (
              <>
                <Icon className="size-5 text-brand-text" aria-hidden />
                {label}
              </>
            );
            return canStudy ? (
              <Link key={slug} href={`/sets/${set.id}/${slug}`} className={className}>
                {content}
              </Link>
            ) : (
              <span key={slug} aria-disabled="true" className={className}>
                {content}
              </span>
            );
          })}
        </nav>
        {!canStudy && (
          <p className="text-sm text-muted-foreground">
            O&apos;rganishni boshlash uchun to&apos;plamda kamida {LIMITS.minCardsToStudy} ta karta
            bo&apos;lishi kerak.
            {set.isOwner && (
              <>
                {" "}
                <Link
                  href={`/sets/${set.id}/edit`}
                  className="font-semibold text-brand-text hover:underline"
                >
                  Karta qo&apos;shish
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      <SetStudyView cards={set.cards} />
    </div>
  );
}
