"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SpeakButton, StarButton } from "@/components/flashcard/card-tool-buttons";
import { CardFaceText, FlipCard } from "@/components/flashcard/flip-card";
import { MasteryBadge } from "@/components/sets/mastery-badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useSpeech } from "@/hooks/use-speech";
import type { ViewerCard } from "@/lib/queries/set-view";

/** Set page body: flip-card preview plus the full term list with mastery. */
export function SetStudyView({ cards }: { cards: ViewerCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { starred, toggle } = useFavorites(cards.filter((c) => c.starred).map((c) => c.id));
  const { supported: canSpeak, speak } = useSpeech();
  const card = cards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + delta)));
  }

  return (
    <div className="grid grid-cols-1 gap-10">
      {card && (
        <section aria-label="Kartalarni ko'rib chiqish" className="grid gap-4">
          <FlipCard
            className="aspect-[4/3] w-full sm:aspect-[16/9]"
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            frontLabel="Atama"
            backLabel="Tarjima"
            front={<CardFaceText text={card.term} />}
            back={<CardFaceText text={card.definition} />}
            toolbar={
              <>
                {canSpeak && (
                  <SpeakButton
                    label="Talaffuzni eshitish"
                    onClick={() =>
                      flipped ? speak(card.definition, "uz") : speak(card.term, "en")
                    }
                  />
                )}
                <StarButton starred={starred.has(card.id)} onClick={() => toggle(card.id)} />
              </>
            }
          />
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Oldingi karta"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center font-semibold tabular-nums" aria-live="polite">
              {index + 1} / {cards.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => go(1)}
              disabled={index === cards.length - 1}
              aria-label="Keyingi karta"
            >
              <ChevronRight />
            </Button>
          </div>
        </section>
      )}

      <section aria-labelledby="terms-title" className="grid gap-4">
        <h2 id="terms-title" className="text-lg font-bold">
          Ushbu to&apos;plamdagi atamalar ({cards.length})
        </h2>
        {cards.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-center text-muted-foreground">
            Bu to&apos;plamda hali kartalar yo&apos;q.
          </p>
        ) : (
          <ul className="grid gap-3">
            {cards.map((c) => (
              <li
                key={c.id}
                className="grid gap-3 rounded-xl bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center sm:gap-6"
              >
                <span className="font-semibold break-words">{c.term}</span>
                <span className="break-words text-muted-foreground sm:border-l sm:border-border sm:pl-6 sm:text-foreground">
                  {c.definition}
                </span>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <MasteryBadge mastery={c.mastery} />
                    {c.wrongCount > 0 && (
                      <span className="text-xs whitespace-nowrap text-error-text">
                        {c.wrongCount} ta xato
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    {canSpeak && (
                      <SpeakButton
                        label={`"${c.term}" talaffuzini eshitish`}
                        onClick={() => speak(c.term, "en")}
                      />
                    )}
                    <StarButton starred={starred.has(c.id)} onClick={() => toggle(c.id)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
