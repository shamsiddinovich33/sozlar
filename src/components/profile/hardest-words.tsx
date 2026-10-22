import Link from "next/link";

import type { ProfileStats } from "@/lib/queries/profile";

export function HardestWords({ words }: { words: ProfileStats["hardest"] }) {
  return (
    <section aria-labelledby="hardest-title" className="grid gap-3">
      <h2 id="hardest-title" className="text-lg font-bold">
        Eng qiyin so&apos;zlar
      </h2>
      {words.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
          Hozircha qiyin so&apos;zlar yo&apos;q. O&apos;rganishni boshlang — xato qilingan
          so&apos;zlar shu yerda ko&apos;rinadi.
        </p>
      ) : (
        <ol className="grid gap-2">
          {words.map((w, i) => (
            <li
              key={w.cardId}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm"
            >
              <span className="text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate font-semibold">
                  {w.term}{" "}
                  <span className="font-normal text-muted-foreground">— {w.definition}</span>
                </span>
                <Link
                  href={`/sets/${w.setId}`}
                  className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  {w.setTitle}
                </Link>
              </span>
              <span className="text-right text-sm whitespace-nowrap">
                <span className="font-semibold text-error">{Math.round(w.errorRate * 100)}%</span>
                <span className="block text-xs text-muted-foreground">{w.wrongCount} ta xato</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
