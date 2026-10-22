"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SeparatorField } from "@/components/import-dialog/separator-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_IMPORT_OPTIONS,
  parseImport,
  looksLikeHeader,
  validateImportOptions,
  type CardSeparator,
  type ImportOptions,
  type TermSeparator,
} from "@/lib/import-parser";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 200;

const TERM_OPTIONS: { value: TermSeparator; label: string }[] = [
  { value: "tab", label: "Tab" },
  { value: "comma", label: "Vergul" },
  { value: "custom", label: "O'zingizniki" },
];

const CARD_OPTIONS: { value: CardSeparator; label: string }[] = [
  { value: "newline", label: "Yangi qator" },
  { value: "semicolon", label: "Nuqtali vergul" },
  { value: "custom", label: "O'zingizniki" },
];

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persists the import; resolves to true on success. */
  onImport: (text: string, options: ImportOptions) => Promise<boolean>;
};

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deferredText = useDeferredValue(text);
  const optionsError = validateImportOptions(options);
  // The header checkbox follows auto-detection until the user changes it.
  const [headerTouched, setHeaderTouched] = useState(false);
  const detectedHeader = useMemo(
    () => looksLikeHeader(deferredText, options),
    [deferredText, options],
  );
  const effectiveOptions = useMemo<ImportOptions>(
    () => ({
      ...options,
      skipHeader: headerTouched ? options.skipHeader === true : detectedHeader,
    }),
    [options, headerTouched, detectedHeader],
  );
  const result = useMemo(
    () => parseImport(deferredText, effectiveOptions),
    [deferredText, effectiveOptions],
  );
  const validCount = result.cards.length;

  function reset() {
    setText("");
    setOptions(DEFAULT_IMPORT_OPTIONS);
    setHeaderTouched(false);
  }

  async function handleFile(file: File) {
    if (file.size > LIMITS.importFileBytes) {
      toast.error("Fayl juda katta (1 MB dan oshmasin)");
      return;
    }
    const content = await file.text();
    const isTsv = /\.tsv$/i.test(file.name) || (!content.includes(",") && content.includes("\t"));
    setText(content);
    setHeaderTouched(false);
    setOptions({ termSeparator: isTsv ? "tab" : "comma", cardSeparator: "newline" });
  }

  async function handleImport() {
    if (validCount === 0 || optionsError) return;
    setSubmitting(true);
    const ok = await onImport(text, effectiveOptions);
    setSubmitting(false);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ommaviy import</DialogTitle>
          <DialogDescription>
            Ma&apos;lumotlarni Excel, Word yoki Google Docs&apos;dan nusxalab joylashtiring yoki CSV
            fayl yuklang.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 overflow-y-auto pr-1">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="import-text" className="text-sm font-semibold">
                Matn
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp aria-hidden />
                CSV yuklash
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                className="hidden"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
            <Textarea
              id="import-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={LIMITS.importTextMax}
              placeholder={"So'z 1\tTarjima 1\nSo'z 2\tTarjima 2\nSo'z 3\tTarjima 3"}
              className="field-sizing-fixed h-44 resize-y font-mono"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="import-skip-header"
              checked={effectiveOptions.skipHeader === true}
              onCheckedChange={(checked) => {
                setHeaderTouched(true);
                setOptions((o) => ({ ...o, skipHeader: checked === true }));
              }}
            />
            <Label htmlFor="import-skip-header" className="cursor-pointer font-normal">
              Birinchi qator sarlavha (import qilinmaydi)
            </Label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SeparatorField
              legend="Atama va tarjima orasida"
              value={options.termSeparator}
              options={TERM_OPTIONS}
              onValueChange={(termSeparator) => setOptions((o) => ({ ...o, termSeparator }))}
              custom={options.customTermSeparator ?? ""}
              onCustomChange={(customTermSeparator) =>
                setOptions((o) => ({ ...o, customTermSeparator }))
              }
            />
            <SeparatorField
              legend="Kartalar orasida"
              value={options.cardSeparator}
              options={CARD_OPTIONS}
              onValueChange={(cardSeparator) => setOptions((o) => ({ ...o, cardSeparator }))}
              custom={options.customCardSeparator ?? ""}
              onCustomChange={(customCardSeparator) =>
                setOptions((o) => ({ ...o, customCardSeparator }))
              }
            />
          </div>

          <section aria-labelledby="import-preview-title" className="grid gap-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 id="import-preview-title" className="text-sm font-semibold">
                Ko&apos;rib chiqish
              </h3>
              <p role="status" className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{validCount} ta karta</span>
                {result.invalidCount > 0 && (
                  <span className="text-error-text">
                    {" "}
                    · {result.invalidCount} ta xato qator (o&apos;tkazib yuboriladi)
                  </span>
                )}
              </p>
            </div>
            {optionsError ? (
              <p className="text-sm text-error-text">{optionsError}</p>
            ) : result.rows.length === 0 ? (
              <p className="rounded-lg bg-secondary px-3 py-6 text-center text-sm text-muted-foreground">
                Joylashtirilgan ma&apos;lumotlar shu yerda ko&apos;rinadi
              </p>
            ) : (
              <ol className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg bg-secondary p-2">
                {result.rows.slice(0, PREVIEW_LIMIT).map((row) => (
                  <li
                    key={row.row}
                    className={cn(
                      "grid grid-cols-[2.5rem_1fr_1fr] gap-3 rounded-md bg-card px-3 py-2 text-sm",
                      row.error && "ring-2 ring-error/70",
                    )}
                  >
                    <span className="text-muted-foreground tabular-nums">{row.row}</span>
                    <span className="break-words">{row.term || "—"}</span>
                    <span className="break-words">
                      {row.definition || "—"}
                      {row.error && (
                        <span className="block text-xs font-semibold text-error-text">
                          {row.error}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
                {result.rows.length > PREVIEW_LIMIT && (
                  <li className="px-3 py-1 text-xs text-muted-foreground">
                    … yana {result.rows.length - PREVIEW_LIMIT} ta qator
                  </li>
                )}
              </ol>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            variant="cta"
            onClick={() => void handleImport()}
            disabled={submitting || validCount === 0 || !!optionsError}
          >
            {submitting && <Loader2 className="animate-spin" aria-hidden />}
            Import{validCount > 0 ? ` (${validCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
