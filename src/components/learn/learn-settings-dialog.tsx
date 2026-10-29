"use client";

import { useId } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isQuestionMode, type QuestionMode } from "@/lib/learning";
import type { PromptSide } from "@/stores/learn-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptSide: PromptSide;
  onPromptSideChange: (side: PromptSide) => void;
  questionMode: QuestionMode;
  onQuestionModeChange: (mode: QuestionMode) => void;
};

const QUESTION_MODE_OPTIONS: { value: QuestionMode; label: string; hint: string }[] = [
  {
    value: "mixed",
    label: "Aralash",
    hint: "Yangi so'zlarda variant tanlaysiz, tanish so'zlarni yozasiz",
  },
  { value: "choice", label: "Faqat variant tanlash", hint: "Har doim 4 ta variantdan tanlaysiz" },
  { value: "typed", label: "Faqat yozish", hint: "Har doim javobni o'zingiz yozasiz" },
];

function Option({
  id,
  value,
  label,
  hint,
}: {
  id: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <RadioGroupItem value={value} id={`${id}-${value}`} className="mt-0.5" />
      <Label htmlFor={`${id}-${value}`} className="grid cursor-pointer gap-0.5 font-normal">
        <span>{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </Label>
    </div>
  );
}

export function LearnSettingsDialog({
  open,
  onOpenChange,
  promptSide,
  onPromptSideChange,
  questionMode,
  onQuestionModeChange,
}: Props) {
  const sideId = useId();
  const modeId = useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sozlamalar</DialogTitle>
          <DialogDescription>Savollar qanday ko&apos;rinishini tanlang.</DialogDescription>
        </DialogHeader>

        <fieldset className="grid gap-3">
          <legend id={modeId} className="mb-3 text-sm font-semibold">
            Savol turi
          </legend>
          <RadioGroup
            aria-labelledby={modeId}
            value={questionMode}
            onValueChange={(v) => isQuestionMode(v) && onQuestionModeChange(v)}
          >
            {QUESTION_MODE_OPTIONS.map((o) => (
              <Option key={o.value} id={modeId} {...o} />
            ))}
          </RadioGroup>
        </fieldset>

        <div aria-hidden className="border-t border-border/60" />

        <fieldset className="grid gap-3">
          <legend id={sideId} className="mb-3 text-sm font-semibold">
            Savolda ko&apos;rsatiladi
          </legend>
          <RadioGroup
            aria-labelledby={sideId}
            value={promptSide}
            onValueChange={(v) => onPromptSideChange(v === "term" ? "term" : "definition")}
          >
            <Option id={sideId} value="definition" label="Tarjima — javob sifatida atama" />
            <Option id={sideId} value="term" label="Atama — javob sifatida tarjima" />
          </RadioGroup>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
