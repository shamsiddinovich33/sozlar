"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/limits";
import type { EditorCard } from "@/lib/set-sync";
import { cn } from "@/lib/utils";

type CardRowProps = {
  card: EditorCard;
  index: number;
  isDuplicate: boolean;
  onChange: (id: string, field: "term" | "definition", value: string) => void;
  onDelete: (id: string) => void;
};

function CardRowInner({ card, index, isDuplicate, onChange, onDelete }: CardRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const termEmpty = card.term.trim() === "";
  const definitionEmpty = card.definition.trim() === "";
  const incomplete = termEmpty !== definitionEmpty;
  const number = index + 1;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/row relative rounded-xl bg-card shadow-sm",
        isDragging && "z-10 shadow-xl ring-2 ring-brand",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-sm font-bold text-muted-foreground tabular-nums">{number}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`${number}-kartani ko'chirish`}
            className="grid size-9 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            aria-label={`${number}-kartani o'chirish`}
            className="grid size-9 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-error focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Textarea
            rows={1}
            value={card.term}
            maxLength={LIMITS.fieldMax}
            onChange={(e) => onChange(card.id, "term", e.target.value)}
            aria-invalid={incomplete && termEmpty}
            data-field="term"
            aria-label={`${number}-karta: atama`}
            className="min-h-11 resize-none"
          />
          <span
            aria-hidden
            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Atama
          </span>
        </div>
        <div className="grid gap-1.5">
          <Textarea
            rows={1}
            value={card.definition}
            maxLength={LIMITS.fieldMax}
            onChange={(e) => onChange(card.id, "definition", e.target.value)}
            aria-invalid={incomplete && definitionEmpty}
            data-field="definition"
            aria-label={`${number}-karta: tarjima`}
            className="min-h-11 resize-none"
          />
          <span
            aria-hidden
            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Tarjima
          </span>
        </div>
      </div>
      {(incomplete || isDuplicate) && (
        <div className="grid gap-1 px-4 pb-3 text-sm">
          {incomplete && (
            <p className="text-error group-focus-within/row:hidden">
              {termEmpty ? "Atama" : "Tarjima"} bo&apos;sh bo&apos;lmasligi kerak — karta
              saqlanmaydi
            </p>
          )}
          {isDuplicate && (
            <p className="text-amber-600 dark:text-accent-yellow">
              Bu so&apos;z to&apos;plamda takrorlangan
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export const CardRow = memo(CardRowInner);
