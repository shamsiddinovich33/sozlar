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
import type { PromptSide } from "@/stores/learn-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptSide: PromptSide;
  onPromptSideChange: (side: PromptSide) => void;
};

export function LearnSettingsDialog({ open, onOpenChange, promptSide, onPromptSideChange }: Props) {
  const id = useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sozlamalar</DialogTitle>
          <DialogDescription>Savollar qanday ko&apos;rinishini tanlang.</DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-3">
          <legend id={id} className="mb-3 text-sm font-semibold">
            Savolda ko&apos;rsatiladi
          </legend>
          <RadioGroup
            aria-labelledby={id}
            value={promptSide}
            onValueChange={(v) => onPromptSideChange(v === "term" ? "term" : "definition")}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="definition" id={`${id}-definition`} />
              <Label htmlFor={`${id}-definition`} className="cursor-pointer font-normal">
                Tarjima — javob sifatida atamani tanlaysiz
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="term" id={`${id}-term`} />
              <Label htmlFor={`${id}-term`} className="cursor-pointer font-normal">
                Atama — javob sifatida tarjimani tanlaysiz
              </Label>
            </div>
          </RadioGroup>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
