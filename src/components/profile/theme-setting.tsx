"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const value = mounted && resolvedTheme === "light" ? "light" : "dark";

  return (
    <RadioGroup
      aria-label="Mavzu"
      value={value}
      onValueChange={setTheme}
      className="grid grid-cols-2 gap-3 sm:max-w-sm"
    >
      {[
        { id: "dark", label: "Qorong'i", icon: Moon },
        { id: "light", label: "Yorug'", icon: Sun },
      ].map(({ id, label, icon: Icon }) => (
        <Label
          key={id}
          htmlFor={`theme-${id}`}
          className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-3 font-normal has-[[data-state=checked]]:border-brand"
        >
          <RadioGroupItem value={id} id={`theme-${id}`} />
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {label}
        </Label>
      ))}
    </RadioGroup>
  );
}
