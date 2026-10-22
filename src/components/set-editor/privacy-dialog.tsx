"use client";

import { useState } from "react";
import { Globe, KeyRound, Loader2, Lock, type LucideIcon } from "lucide-react";
import type { Visibility } from "@prisma/client";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LIMITS } from "@/lib/limits";
import type { VisibilityInput } from "@/lib/validators/set";

export const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { value: "PUBLIC", label: "Hamma", description: "Havolaga ega har kim ko'ra oladi", icon: Globe },
  {
    value: "PASSWORD",
    label: "Parol bilan",
    description: "Faqat parolni biladiganlar ko'ra oladi",
    icon: KeyRound,
  },
  { value: "PRIVATE", label: "Faqat men", description: "Faqat siz ko'ra olasiz", icon: Lock },
];

type PrivacyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: Visibility;
  hasPassword: boolean;
  /** Persists the change; resolves to an error message or null on success. */
  onSave: (input: VisibilityInput) => Promise<string | null>;
};

export function PrivacyDialog(props: PrivacyDialogProps) {
  // Remount the form each time the dialog opens so it starts from the saved values.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <PrivacyForm {...props} />}
    </Dialog>
  );
}

function PrivacyForm({ onOpenChange, visibility, hasPassword, onSave }: PrivacyDialogProps) {
  const [value, setValue] = useState<Visibility>(visibility);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    const needsPassword = value === "PASSWORD" && (!hasPassword || password !== "");
    if (needsPassword && password.length < LIMITS.setPasswordMin) {
      setError(`Parol kamida ${LIMITS.setPasswordMin} ta belgi bo'lishi kerak`);
      return;
    }
    setSaving(true);
    const input: VisibilityInput =
      value === "PASSWORD" ? { visibility: value, password } : { visibility: value };
    const message = await onSave(input);
    setSaving(false);
    if (message) setError(message);
    else onOpenChange(false);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Kimga ko&apos;rinadi</DialogTitle>
        <DialogDescription>To&apos;plamingizni kim ko&apos;ra olishini tanlang.</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="grid gap-5"
      >
        <RadioGroup
          value={value}
          onValueChange={(v) => setValue(v as Visibility)}
          className="gap-2"
        >
          {VISIBILITY_OPTIONS.map(({ value: optionValue, label, description, icon: Icon }) => (
            <Label
              key={optionValue}
              htmlFor={`visibility-${optionValue}`}
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-3 font-normal has-[[data-state=checked]]:border-brand"
            >
              <RadioGroupItem value={optionValue} id={`visibility-${optionValue}`} />
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <span className="grid gap-0.5">
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        {value === "PASSWORD" && (
          <div className="grid gap-2">
            <Label htmlFor="set-password">
              {hasPassword ? "Yangi parol (ixtiyoriy)" : "To'plam paroli"}
            </Label>
            <PasswordInput
              id="set-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={LIMITS.setPasswordMax}
              aria-invalid={!!error}
              aria-describedby="set-password-hint"
            />
            <p id="set-password-hint" className="text-xs text-muted-foreground">
              {hasPassword
                ? "Parol o'rnatilgan. O'zgartirish uchun yangisini kiriting."
                : `Kamida ${LIMITS.setPasswordMin} ta belgi`}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-error-text">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            Saqlash
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
