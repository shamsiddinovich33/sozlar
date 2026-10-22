"use client";

import { create } from "zustand";

import {
  CHECKIN_EVERY,
  buildChoices,
  checkTypedAnswer,
  createSession,
  isSessionComplete,
  nextCardId,
  questionTypeFor,
  recordAnswer,
  type CardProgressState,
  type Choice,
  type LearnSession,
  type QuestionType,
  type SessionGoal,
} from "@/lib/learning";

export type LearnCard = { id: string; term: string; definition: string };
/** Which side is shown as the question; the answer is the other side. */
export type PromptSide = "definition" | "term";

export type Question = {
  /** Unique per asked question (keys the enter animation) */
  seq: number;
  cardId: string;
  type: QuestionType;
  prompt: string;
  promptSide: PromptSide;
  answer: string;
  options: Choice[];
  correctIndex: number;
};

export type Feedback = {
  correct: boolean;
  chosenIndex: number | null;
  typed: string | null;
  dontKnow: boolean;
};

export type Phase = "question" | "almost" | "feedback" | "checkin" | "done";

/** Emitted for every final answer so the caller can persist it. */
export type AnswerEvent = { cardId: string; correct: boolean };

type LearnState = {
  cards: Record<string, LearnCard>;
  session: LearnSession | null;
  question: Question | null;
  phase: Phase;
  feedback: Feedback | null;
  pendingTyped: string | null;
  promptSide: PromptSide;
  startedAt: number;
  finishedAt: number | null;

  start: (
    cards: LearnCard[],
    scope: string[],
    saved: CardProgressState[],
    goal: SessionGoal,
  ) => void;
  answerChoice: (index: number) => AnswerEvent | null;
  answerTyped: (text: string) => AnswerEvent | null;
  confirmAlmost: (accept: boolean) => AnswerEvent | null;
  dontKnow: () => AnswerEvent | null;
  next: () => void;
  resumeAfterCheckin: () => void;
  setPromptSide: (side: PromptSide) => void;
  syncProgress: (progress: CardProgressState) => void;
};

let questionSeq = 0;

function buildQuestion(
  session: LearnSession,
  cards: Record<string, LearnCard>,
  promptSide: PromptSide,
  cardId: string,
): Question | null {
  const card = cards[cardId];
  const progress = session.progress[cardId];
  if (!card || !progress) return null;
  const answerSide = promptSide === "definition" ? "term" : "definition";
  const type = questionTypeFor(progress.mastery);
  const pool = Object.values(cards).map((c) => ({ cardId: c.id, text: c[answerSide] }));
  const { options, correctIndex } =
    type === "multiple_choice"
      ? buildChoices({ cardId, text: card[answerSide] }, pool, Math.random)
      : { options: [], correctIndex: -1 };
  questionSeq += 1;
  return {
    seq: questionSeq,
    cardId,
    type,
    prompt: card[promptSide],
    promptSide,
    answer: card[answerSide],
    options,
    correctIndex,
  };
}

function nextQuestion(
  state: Pick<LearnState, "session" | "cards" | "promptSide">,
): Question | null {
  if (!state.session) return null;
  const cardId = nextCardId(state.session, new Date());
  return cardId ? buildQuestion(state.session, state.cards, state.promptSide, cardId) : null;
}

export const useLearnStore = create<LearnState>()((set, get) => {
  /** Records the final answer for the current question and shows feedback. */
  function finalize(correct: boolean, feedback: Omit<Feedback, "correct">): AnswerEvent | null {
    const { session, question } = get();
    if (!session || !question) return null;
    set({
      session: recordAnswer(session, question.cardId, correct, new Date()),
      phase: "feedback",
      feedback: { correct, ...feedback },
      pendingTyped: null,
    });
    return { cardId: question.cardId, correct };
  }

  return {
    cards: {},
    session: null,
    question: null,
    phase: "question",
    feedback: null,
    pendingTyped: null,
    promptSide: "definition",
    startedAt: 0,
    finishedAt: null,

    start: (cards, scope, saved, goal) => {
      const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
      const session = createSession(scope, saved, goal);
      const done = isSessionComplete(session);
      const question = done
        ? null
        : nextQuestion({ session, cards: byId, promptSide: get().promptSide });
      set({
        cards: byId,
        session,
        question,
        phase: done ? "done" : "question",
        feedback: null,
        pendingTyped: null,
        startedAt: Date.now(),
        finishedAt: done ? Date.now() : null,
      });
    },

    answerChoice: (index) => {
      const { question, phase } = get();
      if (phase !== "question" || !question || question.type !== "multiple_choice") return null;
      if (index < 0 || index >= question.options.length) return null;
      return finalize(index === question.correctIndex, {
        chosenIndex: index,
        typed: null,
        dontKnow: false,
      });
    },

    answerTyped: (text) => {
      const { question, phase } = get();
      if (phase !== "question" || !question || question.type !== "typed") return null;
      const result = checkTypedAnswer(text, question.answer);
      if (result === "almost") {
        set({ phase: "almost", pendingTyped: text });
        return null;
      }
      return finalize(result === "correct", { chosenIndex: null, typed: text, dontKnow: false });
    },

    confirmAlmost: (accept) => {
      const { phase, pendingTyped } = get();
      if (phase !== "almost") return null;
      return finalize(accept, { chosenIndex: null, typed: pendingTyped, dontKnow: false });
    },

    dontKnow: () => {
      const { phase } = get();
      if (phase !== "question" && phase !== "almost") return null;
      return finalize(false, { chosenIndex: null, typed: null, dontKnow: true });
    },

    next: () => {
      const state = get();
      if (state.phase !== "feedback" || !state.session) return;
      if (isSessionComplete(state.session)) {
        set({ phase: "done", question: null, feedback: null, finishedAt: Date.now() });
        return;
      }
      if (state.session.questionNumber % CHECKIN_EVERY === 0) {
        set({ phase: "checkin", feedback: null });
        return;
      }
      set({ phase: "question", feedback: null, question: nextQuestion(state) });
    },

    resumeAfterCheckin: () => {
      const state = get();
      if (state.phase !== "checkin") return;
      set({ phase: "question", question: nextQuestion(state) });
    },

    setPromptSide: (promptSide) => {
      const state = get();
      set({ promptSide });
      // Rebuild an unanswered question so it uses the new direction.
      if (state.phase === "question" && state.session && state.question) {
        set({
          question: buildQuestion(state.session, state.cards, promptSide, state.question.cardId),
        });
      }
    },

    syncProgress: (progress) => {
      const { session } = get();
      const local = session?.progress[progress.cardId];
      if (!session || !local) return;
      // Adopt the server's state unless it is older than what we already have locally.
      const attempts = (p: CardProgressState) => p.correctCount + p.wrongCount;
      if (attempts(progress) < attempts(local)) return;
      set({
        session: { ...session, progress: { ...session.progress, [progress.cardId]: progress } },
      });
    },
  };
});
