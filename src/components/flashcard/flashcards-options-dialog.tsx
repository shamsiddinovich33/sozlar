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
import { Switch } from "@/components/ui/switch";

export type FlashcardsOptions = {
  shuffle: boolean;
  termFirst: boolean;
  starredOnly: boolean;
  autoplay: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: FlashcardsOptions;
  onChange: (options: FlashcardsOptions) => void;
  starredCount: number;
};

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="grid cursor-pointer gap-1">
        <span className="font-semibold">{label}</span>
        {description && (
          <span className="text-xs font-normal text-muted-foreground">{description}</span>
        )}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function FlashcardsOptionsDialog({
  open,
  onOpenChange,
  options,
  onChange,
  starredCount,
}: Props) {
  const sideId = useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sozlamalar</DialogTitle>
          <DialogDescription>Kartalarni qanday o&apos;rganishni tanlang.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <SwitchRow
            label="Aralashtirish"
            checked={options.shuffle}
            onCheckedChange={(shuffle) => onChange({ ...options, shuffle })}
          />
          <SwitchRow
            label="Faqat yulduzchali kartalar"
            description={`${starredCount} ta karta belgilangan`}
            checked={options.starredOnly}
            onCheckedChange={(starredOnly) => onChange({ ...options, starredOnly })}
          />
          <SwitchRow
            label="Avtomatik o'ynatish"
            description="Kartalar o'zi aylanadi va almashadi"
            checked={options.autoplay}
            onCheckedChange={(autoplay) => {
              onChange({ ...options, autoplay });
              if (autoplay) onOpenChange(false);
            }}
          />
          <fieldset className="grid gap-3">
            <legend id={sideId} className="mb-3 text-sm font-semibold">
              Avval ko&apos;rsatish
            </legend>
            <RadioGroup
              aria-labelledby={sideId}
              value={options.termFirst ? "term" : "definition"}
              onValueChange={(v) => onChange({ ...options, termFirst: v === "term" })}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="term" id={`${sideId}-term`} />
                <Label htmlFor={`${sideId}-term`} className="cursor-pointer font-normal">
                  Atama
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="definition" id={`${sideId}-definition`} />
                <Label htmlFor={`${sideId}-definition`} className="cursor-pointer font-normal">
                  Tarjima
                </Label>
              </div>
            </RadioGroup>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  );
}
