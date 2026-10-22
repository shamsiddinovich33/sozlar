"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SeparatorFieldProps<T extends string> = {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onValueChange: (value: T) => void;
  custom: string;
  onCustomChange: (value: string) => void;
};

export function SeparatorField<T extends string>({
  legend,
  value,
  options,
  onValueChange,
  custom,
  onCustomChange,
}: SeparatorFieldProps<T>) {
  const id = useId();
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange(v as T)}
        className="flex flex-wrap items-center gap-x-5 gap-y-3"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
            <Label htmlFor={`${id}-${option.value}`} className="cursor-pointer font-normal">
              {option.label}
            </Label>
          </div>
        ))}
        {value === "custom" && (
          <Input
            value={custom}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Masalan: -"
            aria-label={`${legend}: o'zingizniki`}
            maxLength={10}
            className="h-9 w-28"
            autoFocus
          />
        )}
      </RadioGroup>
    </fieldset>
  );
}
