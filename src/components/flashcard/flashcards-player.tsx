"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Pause,
  Play,
  Settings2,
  X,
} from "lucide-react";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  finishStudySession,
  startStudySession,
  submitAnswer,
} from "@/app/(app)/sets/study-actions";
import { SpeakButton, StarButton } from "@/components/flashcard/card-tool-buttons";
import { CardFaceText, FlipCard } from "@/components/flashcard/flip-card";
import { SwipeCard } from "@/components/flashcard/swipe-card";
import {
  FlashcardsOptionsDialog,
  type FlashcardsOptions,
} from "@/components/flashcard/flashcards-options-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFavorites } from "@/hooks/use-favorites";
import { useSpeech } from "@/hooks/use-speech";
import {
  buildOrder,
  countResults,
  createDeck,
  deckReducer,
  unknownIds,
  type CardResult,
  type DeckCard,
} from "@/lib/flashcards/deck";

const OPTIONS_KEY = "sozlik:flashcards-options";
const AUTOPLAY_MS = 2500;

const DEFAULT_OPTIONS: FlashcardsOptions = {
  shuffle: false,
  termFirst: true,
  starredOnly: false,
  autoplay: false,
};

function loadOptions(): FlashcardsOptions {
  try {
    const raw = window.localStorage.getItem(OPTIONS_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_OPTIONS;
    const o = parsed as Record<string, unknown>;
    return {
      shuffle: o.shuffle === true,
      termFirst: o.termFirst !== false,
      starredOnly: o.starredOnly === true,
      autoplay: false,
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

function saveOptions(options: FlashcardsOptions) {
  try {
    const persisted = {
      shuffle: options.shuffle,
      termFirst: options.termFirst,
      starredOnly: options.starredOnly,
    };
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(persisted));
  } catch {
    // Storage can be unavailable (private mode); options just won't persist.
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

const SHORTCUTS = [
  ["Probel", "Kartani aylantirish"],
  ["← / →", "Oldingi / keyingi karta"],
  ["K", "Bilaman"],
  ["J", "Bilmayman"],
] as const;

type FlashcardsPlayerProps = {
  setId: string;
  title: string;
  cards: (DeckCard & { starred: boolean })[];
};

export function FlashcardsPlayer({ setId, title, cards }: FlashcardsPlayerProps) {
  const reduceMotion = useReducedMotion();
  const { starred, toggle: toggleStar } = useFavorites(
    cards.filter((c) => c.starred).map((c) => c.id),
  );
  const { supported: canSpeak, speak } = useSpeech();
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const [options, setOptions] = useState<FlashcardsOptions>(DEFAULT_OPTIONS);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deck, dispatch] = useReducer(
    deckReducer,
    cards.map((c) => c.id),
    createDeck,
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const sessionIdRef = useRef<string | null>(null);

  const restart = useCallback(
    (next: FlashcardsOptions, ids?: string[]) => {
      const order =
        ids ??
        buildOrder(cards, starred, {
          shuffle: next.shuffle,
          starredOnly: next.starredOnly,
          seed: Math.floor(Math.random() * 2 ** 31),
        });
      setDirection(1);
      dispatch({ type: "restart", order });
    },
    [cards, starred],
  );

  // Load saved options once (client only) and start the first round with them.
  useEffect(() => {
    const saved = loadOptions();
    setOptions(saved);
    if (saved.shuffle || saved.starredOnly) restart(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record a study session so the set shows up under "Davom etish".
  useEffect(() => {
    let cancelled = false;
    void startStudySession(setId, "FLASHCARDS").then((result) => {
      if (!cancelled && result.ok) sessionIdRef.current = result.data.sessionId;
    });
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const counts = countResults(deck);
  useEffect(() => {
    if (!deck.finished || !sessionIdRef.current || deck.order.length === 0) return;
    void finishStudySession({
      sessionId: sessionIdRef.current,
      correct: counts.known,
      wrong: counts.unknown,
    });
  }, [deck.finished, deck.order.length, counts.known, counts.unknown]);

  // "Bilaman" / "Bilmayman" update word progress with the same rules as Learn.
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const recordProgress = useMutation({
    mutationFn: async (vars: { cardId: string; correct: boolean }) => {
      const result = await submitAnswer({ setId, ...vars });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: 2,
    onError: () => toast.error("Natija saqlanmadi. Internet aloqasini tekshiring"),
  });

  const stopAutoplay = useCallback(() => {
    setOptions((o) => (o.autoplay ? { ...o, autoplay: false } : o));
  }, []);

  const act = useCallback(
    (action: "flip" | "next" | "prev" | CardResult, fromAutoplay = false) => {
      if (!fromAutoplay) stopAutoplay();
      if (action === "flip") dispatch({ type: "flip" });
      else if (action === "next" || action === "prev") {
        setDirection(action === "next" ? 1 : -1);
        dispatch({ type: action });
      } else {
        const current = deckRef.current;
        const cardId = current.finished ? undefined : current.order[current.index];
        if (cardId) recordProgress.mutate({ cardId, correct: action === "known" });
        setDirection(action === "known" ? 1 : -1);
        dispatch({ type: "mark", result: action });
      }
    },
    [stopAutoplay, recordProgress],
  );

  // Autoplay: show the front, flip, then move on.
  useEffect(() => {
    if (!options.autoplay || deck.finished) return;
    const timer = setTimeout(() => act(deck.flipped ? "next" : "flip", true), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [options.autoplay, deck.finished, deck.flipped, deck.index, act]);

  // Keyboard shortcuts (ignored while typing or when a dialog is open).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target) || optionsOpen) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const onControl =
        e.target instanceof HTMLElement && e.target.closest("button, a, [role='menuitem']");
      switch (e.key) {
        case " ":
          if (onControl) return; // let focused buttons handle Space themselves
          e.preventDefault();
          act("flip");
          break;
        case "ArrowRight":
          e.preventDefault();
          act("next");
          break;
        case "ArrowLeft":
          e.preventDefault();
          act("prev");
          break;
        case "k":
        case "K":
          act("known");
          break;
        case "j":
        case "J":
          act("unknown");
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [act, optionsOpen]);

  function handleOptionsChange(next: FlashcardsOptions) {
    const reorder = next.shuffle !== options.shuffle || next.starredOnly !== options.starredOnly;
    setOptions(next);
    saveOptions(next);
    if (reorder) restart(next);
  }

  const currentId = deck.order[deck.index];
  const card = currentId ? cardsById.get(currentId) : undefined;
  const total = deck.order.length;
  const position = deck.finished ? total : deck.index + 1;
  const front = card ? (options.termFirst ? card.term : card.definition) : "";
  const back = card ? (options.termFirst ? card.definition : card.term) : "";
  const showingTerm = options.termFirst !== deck.flipped;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/sets/${setId}`}>
          <ArrowLeft aria-hidden />
          <span className="max-w-48 truncate sm:max-w-80">{title}</span>
        </Link>
      </Button>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Klaviatura yorliqlari">
              <Keyboard />
            </Button>
          </TooltipTrigger>
          <TooltipContent align="end">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              {SHORTCUTS.map(([key, label]) => (
                <div key={key} className="contents">
                  <dt>
                    <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                      {key}
                    </kbd>
                  </dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOptionsChange({ ...options, autoplay: !options.autoplay })}
          aria-label={options.autoplay ? "Avtomatik o'ynatishni to'xtatish" : "Avtomatik o'ynatish"}
          aria-pressed={options.autoplay}
          disabled={deck.finished}
        >
          {options.autoplay ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            stopAutoplay();
            setOptionsOpen(true);
          }}
          aria-label="Sozlamalar"
        >
          <Settings2 />
        </Button>
      </div>
    </div>
  );

  const optionsDialog = (
    <FlashcardsOptionsDialog
      open={optionsOpen}
      onOpenChange={setOptionsOpen}
      options={options}
      onChange={handleOptionsChange}
      starredCount={starred.size}
    />
  );

  if (total === 0) {
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
        {header}
        <div className="grid justify-items-center gap-4 rounded-2xl bg-card p-10 text-center">
          <p className="text-lg font-semibold">Yulduzcha qo&apos;yilgan kartalar yo&apos;q</p>
          <p className="text-muted-foreground">
            Kartalarga yulduzcha qo&apos;ying yoki barcha kartalarni o&apos;rganing.
          </p>
          <Button onClick={() => handleOptionsChange({ ...options, starredOnly: false })}>
            Barcha kartalarni ko&apos;rsatish
          </Button>
        </div>
        {optionsDialog}
      </div>
    );
  }

  if (deck.finished) {
    const retry = unknownIds(deck);
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
        {header}
        <section
          aria-labelledby="round-done"
          className="grid justify-items-center gap-6 rounded-2xl bg-card p-8 text-center sm:p-10"
        >
          <h1 id="round-done" className="text-2xl font-bold sm:text-3xl">
            Ajoyib! Barcha kartalarni ko&apos;rib chiqdingiz
          </h1>
          <div className="grid w-full max-w-sm grid-cols-2 gap-4">
            <div className="grid gap-1 rounded-xl bg-success/15 p-4">
              <span className="text-3xl font-bold text-success">{counts.known}</span>
              <span className="text-sm">Bilaman</span>
            </div>
            <div className="grid gap-1 rounded-xl bg-error/15 p-4">
              <span className="text-3xl font-bold text-error">{counts.unknown}</span>
              <span className="text-sm">Bilmayman</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {retry.length > 0 && (
              <Button variant="cta" size="lg" onClick={() => restart(options, retry)} autoFocus>
                Bilmaganlarni takrorlash ({retry.length})
              </Button>
            )}
            <Button
              variant={retry.length > 0 ? "outline" : "cta"}
              size="lg"
              onClick={() => restart(options)}
              autoFocus={retry.length === 0}
            >
              Qaytadan boshlash
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/sets/${setId}`}>To&apos;plamga qaytish</Link>
            </Button>
          </div>
        </section>
        {optionsDialog}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5">
      {header}

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold tabular-nums" aria-live="polite">
            {position} / {total}
          </span>
          <span className="text-muted-foreground">
            <span className="text-success">{counts.known} bilaman</span> ·{" "}
            <span className="text-error">{counts.unknown} bilmayman</span>
          </span>
        </div>
        <Progress
          value={(position / total) * 100}
          aria-label="Kartalar bo'yicha progress"
          indicatorClassName="bg-brand"
        />
      </div>

      <div className="relative">
        {card && (
          <motion.div
            key={`${card.id}-${deck.order.length}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SwipeCard
              disabled={!!reduceMotion}
              onDragStart={stopAutoplay}
              onSwipe={(dir) => act(dir === "right" ? "known" : "unknown")}
            >
              {(wasDragged) => (
                <FlipCard
                  className="aspect-[4/3] w-full sm:aspect-[16/9]"
                  flipped={deck.flipped}
                  onFlip={() => {
                    if (!wasDragged()) act("flip");
                  }}
                  label={`${showingTerm ? "Atama" : "Tarjima"}: ${deck.flipped ? back : front}. Aylantirish uchun bosing`}
                  front={<CardFaceText text={front} />}
                  back={<CardFaceText text={back} />}
                  toolbar={
                    <>
                      {canSpeak && (
                        <SpeakButton
                          label="Talaffuzni eshitish"
                          onClick={() =>
                            showingTerm ? speak(card.term, "en") : speak(card.definition, "uz")
                          }
                        />
                      )}
                      <StarButton
                        starred={starred.has(card.id)}
                        onClick={() => toggleStar(card.id)}
                      />
                    </>
                  }
                />
              )}
            </SwipeCard>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => act("unknown")}
          className="border-error/60 px-3 text-error hover:bg-error/10 hover:text-error sm:px-6"
          aria-keyshortcuts="J"
        >
          <X aria-hidden />
          Bilmayman
        </Button>
        <div className="flex gap-0 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => act("prev")}
            disabled={deck.index === 0}
            aria-label="Oldingi karta"
            aria-keyshortcuts="ArrowLeft"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => act("next")}
            aria-label="Keyingi karta"
            aria-keyshortcuts="ArrowRight"
          >
            <ChevronRight />
          </Button>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => act("known")}
          className="border-success/60 px-3 text-success hover:bg-success/10 hover:text-success sm:px-6"
          aria-keyshortcuts="K"
        >
          <Check aria-hidden />
          Bilaman
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Telefonda: o&apos;ngga suring — bilaman, chapga — bilmayman
      </p>

      {optionsDialog}
    </div>
  );
}
