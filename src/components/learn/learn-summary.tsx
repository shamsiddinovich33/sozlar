"use client";

import Link from "next/link";
import { Clock, Target, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} daqiqa ${seconds} soniya` : `${seconds} soniya`;
}

type LearnSummaryProps = {
  setId: string;
  title: string;
  accuracy: number | null;
  durationMs: number;
  hardest: { id: string; term: string; definition: string; wrong: number }[];
  hasHardWords: boolean;
  onRelearn: () => void;
  onHardOnly: () => void;
};

export function LearnSummary({
  setId,
  title,
  accuracy,
  durationMs,
  hardest,
  hasHardWords,
  onRelearn,
  onHardOnly,
}: LearnSummaryProps) {
  return (
    <section
      aria-labelledby="learn-done"
      className="grid gap-6 rounded-2xl bg-card p-6 text-center sm:p-10"
    >
      <div className="grid justify-items-center gap-3">
        <span className="grid size-16 place-items-center rounded-full bg-accent-yellow/20 text-accent-yellow">
          <Trophy className="size-8" aria-hidden />
        </span>
        <h2 id="learn-done" className="text-2xl font-bold sm:text-3xl">
          Tabriklaymiz! Siz bu bosqichni yakunladingiz
        </h2>
        <p className="text-muted-foreground">{title}</p>
      </div>

      <dl className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
        <div className="grid gap-1 rounded-xl bg-secondary p-4">
          <dt className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Target className="size-4" aria-hidden />
            Aniqlik
          </dt>
          <dd className="text-2xl font-bold text-success-text">
            {accuracy === null ? "—" : `${accuracy}%`}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl bg-secondary p-4">
          <dt className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden />
            Vaqt
          </dt>
          <dd className="text-2xl font-bold">{formatDuration(durationMs)}</dd>
        </div>
      </dl>

      {hardest.length > 0 && (
        <div className="mx-auto grid w-full max-w-lg gap-3 text-left">
          <h2 className="text-lg font-bold">Eng qiyin so&apos;zlar</h2>
          <ol className="grid gap-2">
            {hardest.map((w) => (
              <li
                key={w.id}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-lg bg-secondary px-4 py-2.5"
              >
                <span className="font-semibold break-words">{w.term}</span>
                <span className="break-words text-muted-foreground">{w.definition}</span>
                <span className="text-sm whitespace-nowrap text-error-text">
                  {w.wrong > 0 ? `${w.wrong} ta xato` : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button variant="outline" size="lg" onClick={onRelearn}>
          Qayta o&apos;rganish
        </Button>
        {hasHardWords && (
          <Button variant="cta" size="lg" onClick={onHardOnly} autoFocus>
            Faqat qiyin so&apos;zlar
          </Button>
        )}
        <Button asChild variant={hasHardWords ? "outline" : "cta"} size="lg">
          <Link href={`/sets/${setId}`}>To&apos;plamga qaytish</Link>
        </Button>
      </div>
    </section>
  );
}
