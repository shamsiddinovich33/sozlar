"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Flag, Settings2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  finishStudySession,
  resetProgress,
  startStudySession,
  submitAnswer,
} from "@/app/(app)/sets/study-actions";
import { SpeakButton } from "@/components/flashcard/card-tool-buttons";
import { CheckinDialog } from "@/components/learn/checkin-dialog";
import { ChoiceOptions } from "@/components/learn/choice-options";
import { LearnProgress } from "@/components/learn/learn-progress";
import { LearnSettingsDialog } from "@/components/learn/learn-settings-dialog";
import { LearnSummary } from "@/components/learn/learn-summary";
import { TypedAnswer } from "@/components/learn/typed-answer";
import { ConfirmDialog } from "@/components/sets/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import {
  CHECKIN_EVERY,
  HARD_ERROR_RATE,
  errorRate,
  hardCardIds,
  hardestCardIds,
  isQuestionMode,
  progressPercent,
  sessionPercent,
  type CardProgressState,
  type QuestionMode,
  type SessionGoal,
} from "@/lib/learning";
import { cn } from "@/lib/utils";
import { useLearnStore, type AnswerEvent, type LearnCard } from "@/stores/learn-store";

const CORRECT_MESSAGES = ["Ajoyib!", "Zo'r!", "To'g'ri!", "Barakalla!", "Davom eting!"];
const WRONG_MESSAGE = "Xafa bo'lmang, hali o'rganyapsiz!";
const AUTO_ADVANCE_MS = 1000;

type LearnPlayerProps = {
  setId: string;
  title: string;
  /** The set owner gets a 🚩 button that opens this card in the editor */
  isOwner: boolean;
  cards: LearnCard[];
  saved: CardProgressState[];
};

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

const QUESTION_MODE_KEY = "lexa:learn-question-mode";

export function LearnPlayer({ setId, title, isOwner, cards, saved }: LearnPlayerProps) {
  const store = useLearnStore();
  const { session, question, phase, feedback, pendingTyped, promptSide, questionMode } = store;
  const { supported: canSpeak, speak } = useSpeech();
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);
  const [correctMessage, setCorrectMessage] = useState(CORRECT_MESSAGES[0]!);

  // Restore the remembered question type (a per-browser convenience; storage may be blocked).
  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(QUESTION_MODE_KEY);
      if (isQuestionMode(remembered)) useLearnStore.getState().setQuestionMode(remembered);
    } catch {
      // Storage unavailable: keep the default.
    }
  }, []);

  function changeQuestionMode(mode: QuestionMode) {
    useLearnStore.getState().setQuestionMode(mode);
    try {
      window.localStorage.setItem(QUESTION_MODE_KEY, mode);
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }

  const allIds = useMemo(() => cards.map((c) => c.id), [cards]);
  const savedMastered = saved.filter((p) => p.mastery === "MASTERED").length;
  const savedAttempted = saved.some((p) => p.correctCount + p.wrongCount > 0);
  const allMasteredOnLoad = cards.length > 0 && savedMastered === cards.length;
  // Cards never answered count as 0, so divide by the whole set
  const savedPercent = progressPercent([
    ...saved,
    ...Array<undefined>(Math.max(0, cards.length - saved.length)).fill(undefined),
  ]);
  const savedInProgress = saved.filter(
    (p) => p.mastery !== "MASTERED" && p.correctCount + p.wrongCount > 0,
  ).length;

  const submit = useMutation({
    mutationFn: async (event: AnswerEvent) => {
      const result = await submitAnswer({
        setId,
        cardId: event.cardId,
        correct: event.correct,
        sessionId: sessionIdRef.current ?? undefined,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: 2,
    onSuccess: (progress) => useLearnStore.getState().syncProgress(progress),
    onError: () => toast.error("Javob saqlanmadi. Internet aloqasini tekshiring"),
  });

  const persist = useCallback(
    (event: AnswerEvent | null) => {
      if (!event) return;
      if (event.correct) {
        setCorrectMessage(
          CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)] ?? "To'g'ri!",
        );
      }
      submit.mutate(event);
    },
    [submit],
  );

  const begin = useCallback(
    (scope: string[], progress: CardProgressState[], goal: SessionGoal) => {
      finishedRef.current = false;
      sessionIdRef.current = null;
      useLearnStore.getState().start(cards, scope, progress, goal);
      setStarted(true);
      void startStudySession(setId, "LEARN").then((result) => {
        if (result.ok) sessionIdRef.current = result.data.sessionId;
      });
    },
    [cards, setId],
  );

  // Start right away for a fresh set; otherwise show the resume / all-mastered screen first.
  useEffect(() => {
    if (!savedAttempted) begin(allIds, saved, "mastery");
    // Runs once on mount with the server-provided data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the study session when the round ends.
  useEffect(() => {
    if (phase !== "done" || !started || finishedRef.current || !session) return;
    finishedRef.current = true;
    const sessionId = sessionIdRef.current;
    if (sessionId) {
      void finishStudySession({ sessionId });
    }
  }, [phase, started, session]);

  // Correct answers move on automatically after a moment.
  useEffect(() => {
    if (phase !== "feedback" || !feedback?.correct) return;
    // Give a moment longer to read the note after a hinted answer.
    const delay = feedback.hinted ? AUTO_ADVANCE_MS * 2.5 : AUTO_ADVANCE_MS;
    const timer = setTimeout(() => useLearnStore.getState().next(), delay);
    return () => clearTimeout(timer);
  }, [phase, feedback]);

  // Keys 1–4 answer multiple-choice questions.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const state = useLearnStore.getState();
      if (state.phase !== "question" || state.question?.type !== "multiple_choice") return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < state.question.options.length) {
        e.preventDefault();
        persist(state.answerChoice(index));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [persist]);

  async function restartFromScratch(): Promise<boolean> {
    const result = await resetProgress(setId);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    begin(allIds, [], "mastery");
    toast.success("Progress tiklandi. Boshidan boshlaymiz!");
    return true;
  }

  function startHardOnly(progress: CardProgressState[], ids: string[]) {
    if (ids.length === 0) return;
    begin(ids, progress, "review");
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/sets/${setId}`}>
          <ArrowLeft aria-hidden />
          <span className="max-w-48 truncate sm:max-w-80">{title}</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSettingsOpen(true)}
        aria-label="Sozlamalar"
      >
        <Settings2 />
      </Button>
    </div>
  );

  const dialogs = (
    <>
      <LearnSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        promptSide={promptSide}
        onPromptSideChange={(side) => useLearnStore.getState().setPromptSide(side)}
        questionMode={questionMode}
        onQuestionModeChange={changeQuestionMode}
      />
      <ConfirmDialog
        open={confirmRestart}
        onOpenChange={setConfirmRestart}
        title="Qayta boshlash"
        description="Bu to'plam bo'yicha barcha natijalaringiz o'chiriladi va o'rganish boshidan boshlanadi."
        confirmLabel="Qayta boshlash"
        onConfirm={restartFromScratch}
      />
    </>
  );

  // Resume or all-mastered screen before the first question.
  if (!started) {
    const hardSaved = saved.filter((p) => errorRate(p) > HARD_ERROR_RATE).map((p) => p.cardId);
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
        {header}
        <section className="grid justify-items-center gap-5 rounded-2xl bg-card p-8 text-center sm:p-10">
          {allMasteredOnLoad ? (
            <>
              <h2 className="text-2xl font-bold">Barcha so&apos;zlar o&apos;zlashtirilgan!</h2>
              <p className="text-muted-foreground">
                Qiyin so&apos;zlarni takrorlashingiz yoki boshidan o&apos;rganishingiz mumkin.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {hardSaved.length > 0 && (
                  <Button variant="cta" size="lg" onClick={() => startHardOnly(saved, hardSaved)}>
                    Faqat qiyin so&apos;zlar
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => setConfirmRestart(true)}>
                  Qayta o&apos;rganish
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Xush kelibsiz!</h2>
              <p className="text-lg">
                Siz bu to&apos;plamning{" "}
                <span className="font-bold text-success-text">{savedPercent}%</span> qismini
                o&apos;zlashtirgansiz.
              </p>
              {savedInProgress > 0 && (
                <p className="text-muted-foreground">
                  Yana {savedInProgress} ta so&apos;z ustida ishlayapsiz.
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={() => begin(allIds, saved, "mastery")}
                  autoFocus
                >
                  Davom etish
                </Button>
                <Button variant="outline" size="lg" onClick={() => setConfirmRestart(true)}>
                  Qayta boshlash
                </Button>
              </div>
            </>
          )}
        </section>
        {dialogs}
      </div>
    );
  }

  if (!session) return null;

  if (phase === "done") {
    const answered = session.correct + session.wrong;
    const hardest = hardestCardIds(session).map((id) => {
      const card = store.cards[id];
      return {
        id,
        term: card?.term ?? "",
        definition: card?.definition ?? "",
        wrong: session.progress[id]?.wrongCount ?? 0,
      };
    });
    const hard = hardCardIds(session);
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
        {header}
        <LearnSummary
          setId={setId}
          title={title}
          accuracy={answered === 0 ? null : Math.round((session.correct / answered) * 100)}
          durationMs={(store.finishedAt ?? Date.now()) - store.startedAt}
          hardest={hardest}
          hasHardWords={hard.length > 0}
          onRelearn={() => setConfirmRestart(true)}
          onHardOnly={() => startHardOnly(Object.values(session.progress), hard)}
        />
        {dialogs}
      </div>
    );
  }

  const answered = phase === "feedback";
  const promptLabel = question?.promptSide === "definition" ? "Tarjima" : "Atama";
  const answerLabel = question?.promptSide === "definition" ? "atamani" : "tarjimani";

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
      {header}
      <LearnProgress session={session} />

      {question && (
        <motion.section
          key={question.seq}
          aria-label="Savol"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid gap-5 rounded-2xl bg-card p-5 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {promptLabel}
              </span>
              {canSpeak && (
                <SpeakButton
                  label="Savolni eshitish"
                  onClick={() =>
                    speak(question.prompt, question.promptSide === "definition" ? "uz" : "en")
                  }
                />
              )}
            </span>
            {isOwner && (
              <Link
                href={`/sets/${setId}/edit#card-${question.cardId}`}
                aria-label="Kartani tahrirlash (xato topsangiz)"
                title="Kartani tahrirlash"
                className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                <Flag className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          <p className="text-2xl font-semibold break-words whitespace-pre-wrap sm:text-3xl">
            {question.prompt}
          </p>

          <p className="text-sm font-semibold text-muted-foreground">
            {question.type === "multiple_choice"
              ? `To'g'ri ${answerLabel} tanlang`
              : `${answerLabel.charAt(0).toUpperCase()}${answerLabel.slice(1)} yozing`}
          </p>

          {question.type === "multiple_choice" ? (
            <ChoiceOptions
              options={question.options}
              correctIndex={question.correctIndex}
              feedback={answered && feedback ? feedback : null}
              onChoose={(index) => persist(store.answerChoice(index))}
            />
          ) : phase === "question" ? (
            <TypedAnswer
              key={`${question.cardId}-${session.questionNumber}`}
              answer={question.answer}
              hintLevel={store.hintLevel}
              onHint={() => store.showHint()}
              onSubmit={(text) => persist(store.answerTyped(text))}
              onDontKnow={() => persist(store.dontKnow())}
            />
          ) : null}

          {phase === "almost" && (
            <div
              role="alert"
              className="grid gap-4 rounded-xl border-2 border-accent-yellow/70 p-4"
            >
              <p className="text-lg font-bold">Deyarli to&apos;g&apos;ri!</p>
              <dl className="grid gap-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Siz yozdingiz:</dt>
                  <dd className="font-semibold">{pendingTyped}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">To&apos;g&apos;ri javob:</dt>
                  <dd className="font-semibold text-success-text">{question.answer}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => persist(store.confirmAlmost(true))} autoFocus>
                  To&apos;g&apos;ri deb hisoblash
                </Button>
                <Button variant="outline" onClick={() => persist(store.confirmAlmost(false))}>
                  Xato deb hisoblash
                </Button>
              </div>
            </div>
          )}

          {(phase === "almost" ||
            (phase === "question" && question.type === "multiple_choice")) && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => persist(store.dontKnow())}>
                Bilmayman?
              </Button>
            </div>
          )}

          <div aria-live="assertive" className="contents">
            {answered && feedback && (
              <div
                className={cn(
                  "grid gap-3 rounded-xl p-4",
                  feedback.correct ? "bg-success/15" : "bg-error/10",
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-2 text-lg font-bold",
                    feedback.correct ? "text-success-text" : "text-error-text",
                  )}
                >
                  {feedback.correct ? (
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0.4, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className="inline-flex"
                    >
                      <CheckCircle2 className="size-6" aria-hidden />
                    </motion.span>
                  ) : (
                    <XCircle className="size-6" aria-hidden />
                  )}
                  {feedback.correct ? correctMessage : WRONG_MESSAGE}
                </p>
                {feedback.correct && feedback.hinted && (
                  <p className="text-sm text-muted-foreground">
                    Ko&apos;rsatma bilan topdingiz — bu so&apos;z tez orada yana so&apos;raladi.
                  </p>
                )}
                {!feedback.correct &&
                  (feedback.typed !== null || feedback.dontKnow || question.type === "typed") && (
                    <dl className="grid gap-1 text-sm">
                      {feedback.typed && (
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Sizning javobingiz:</dt>
                          <dd className="font-semibold text-error-text line-through">
                            {feedback.typed}
                          </dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">To&apos;g&apos;ri javob:</dt>
                        <dd className="font-semibold text-success-text">{question.answer}</dd>
                      </div>
                    </dl>
                  )}
                {!feedback.correct && (
                  <div className="flex justify-end">
                    <Button variant="cta" onClick={() => store.next()} autoFocus>
                      Davom etish
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <CheckinDialog
        open={phase === "checkin"}
        percent={sessionPercent(session)}
        answered={session.questionNumber}
        untilNext={CHECKIN_EVERY}
        onRestart={() => {
          store.resumeAfterCheckin();
          setConfirmRestart(true);
        }}
        onContinue={() => store.resumeAfterCheckin()}
      />
      {dialogs}
    </div>
  );
}
