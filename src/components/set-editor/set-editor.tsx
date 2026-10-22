"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ClipboardPaste, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Visibility } from "@prisma/client";

import { createSet, importCards, saveSet, updateVisibility } from "@/app/(app)/sets/actions";
import { ImportDialog } from "@/components/import-dialog/import-dialog";
import { CardRow } from "@/components/set-editor/card-row";
import { PrivacyDialog, VISIBILITY_OPTIONS } from "@/components/set-editor/privacy-dialog";
import { SaveIndicator } from "@/components/set-editor/save-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import type { ImportOptions } from "@/lib/import-parser";
import { LIMITS } from "@/lib/limits";
import {
  applyDiff,
  diffCards,
  findDuplicateTerms,
  isCardBlank,
  isCardComplete,
  isDiffEmpty,
  toSavedCards,
  type EditorCard,
  type SavedCard,
} from "@/lib/set-sync";
import type { VisibilityInput } from "@/lib/validators/set";
import type { ActionResult } from "@/types/actions";

export type SetEditorInitial = {
  setId: string | null;
  title: string;
  description: string;
  visibility: Visibility;
  hasPassword: boolean;
  cards: SavedCard[];
};

type Details = { title: string; description: string };

const NEW_SET_ROWS = 2;

function newCard(): EditorCard {
  return { id: crypto.randomUUID(), term: "", definition: "" };
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function SetEditor({ initial }: { initial: SetEditorInitial }) {
  const router = useRouter();
  const dndId = useId();

  const [setId, setSetId] = useState(initial.setId);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [cards, setCards] = useState<EditorCard[]>(() =>
    initial.cards.length > 0
      ? initial.cards.map(({ id, term, definition }) => ({ id, term, definition }))
      : Array.from({ length: NEW_SET_ROWS }, newCard),
  );
  const [visibility, setVisibility] = useState(initial.visibility);
  const [hasPassword, setHasPassword] = useState(initial.hasPassword);
  const [importOpen, setImportOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Latest editor state for the autosave callback, plus the last state known to be on the server.
  const stateRef = useRef({ title, description, cards });
  stateRef.current = { title, description, cards };
  const setIdRef = useRef(initial.setId);
  const savedCardsRef = useRef<SavedCard[]>(initial.cards);
  const savedDetailsRef = useRef<Details>({
    title: initial.title,
    description: initial.description,
  });
  const listRef = useRef<HTMLOListElement>(null);
  const focusCardIdRef = useRef<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (input: Parameters<typeof createSet>[0]) => unwrap(await createSet(input)),
  });
  const saveMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Parameters<typeof saveSet>[1] }) =>
      unwrap(await saveSet(id, input)),
  });

  /** Sends pending changes. With `force`, creates the set even when nothing was entered yet. */
  const persist = useCallback(
    async (force: boolean) => {
      const { title: t, description: d, cards: current } = stateRef.current;
      const next = toSavedCards(current);
      const incompleteIds = new Set(current.filter((c) => !isCardComplete(c)).map((c) => c.id));
      const diff = diffCards(savedCardsRef.current, next, incompleteIds);
      const details: Details = { title: t, description: d };
      const detailsChanged =
        details.title !== savedDetailsRef.current.title ||
        details.description !== savedDetailsRef.current.description;

      const id = setIdRef.current;
      if (!id) {
        const hasContent = !isDiffEmpty(diff) || t.trim() !== "" || d.trim() !== "";
        if (!hasContent && !force) return;
        const created = await createMutation.mutateAsync({
          ...details,
          create: diff.create,
          update: [],
          deleteIds: [],
        });
        setIdRef.current = created.id;
        setSetId(created.id);
        window.history.replaceState(null, "", `/sets/${created.id}/edit`);
      } else {
        if (isDiffEmpty(diff) && !detailsChanged) return;
        await saveMutation.mutateAsync({ id, input: { ...details, ...diff } });
      }
      savedCardsRef.current = applyDiff(savedCardsRef.current, diff);
      savedDetailsRef.current = details;
    },
    [createMutation, saveMutation],
  );

  const save = useCallback(async () => {
    try {
      await persist(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
      throw error;
    }
  }, [persist]);

  const autosave = useAutosave(save);
  const { schedule, flush, hasPendingChanges } = autosave;

  /** Makes sure the set exists on the server (and everything is saved); returns its id. */
  const ensureSet = useCallback(async (): Promise<string | null> => {
    await flush();
    if (!setIdRef.current) {
      try {
        await persist(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Saqlanmadi");
      }
    }
    return setIdRef.current;
  }, [flush, persist]);

  // Warn before leaving with unsaved or incomplete cards.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      const hasIncomplete = stateRef.current.cards.some(
        (c) => !isCardComplete(c) && !isCardBlank(c),
      );
      if (hasPendingChanges() || hasIncomplete) event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasPendingChanges]);

  // Focus the term field of a newly added card.
  useEffect(() => {
    const id = focusCardIdRef.current;
    if (!id) return;
    focusCardIdRef.current = null;
    const index = cards.findIndex((c) => c.id === id);
    const field =
      listRef.current?.querySelectorAll<HTMLTextAreaElement>('[data-field="term"]')[index];
    field?.focus();
  }, [cards]);

  const updateCards = useCallback(
    (updater: (prev: EditorCard[]) => EditorCard[]) => {
      setCards(updater);
      schedule();
    },
    [schedule],
  );

  const handleCardChange = useCallback(
    (id: string, field: "term" | "definition", value: string) =>
      updateCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))),
    [updateCards],
  );

  const handleDelete = useCallback(
    (id: string) => updateCards((prev) => prev.filter((c) => c.id !== id)),
    [updateCards],
  );

  function handleAdd() {
    if (cards.length >= LIMITS.cardsPerSet) {
      toast.error(`Bitta to'plamda ${LIMITS.cardsPerSet} tadan ortiq karta bo'lishi mumkin emas`);
      return;
    }
    const card = newCard();
    focusCardIdRef.current = card.id;
    setCards((prev) => [...prev, card]);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    updateCards((prev) => {
      const from = prev.findIndex((c) => c.id === active.id);
      const to = prev.findIndex((c) => c.id === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  }

  async function handleImport(text: string, options: ImportOptions): Promise<boolean> {
    const id = await ensureSet();
    if (!id) return false;
    const result = await importCards(id, { text, options });
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    const imported = result.data.cards;
    savedCardsRef.current = [...savedCardsRef.current, ...imported];
    setCards((prev) => [
      ...prev.filter((c) => !isCardBlank(c)),
      ...imported.map(({ id: cardId, term, definition }) => ({ id: cardId, term, definition })),
    ]);
    // Positions are renumbered on the next save.
    schedule();
    toast.success(
      `${imported.length} ta karta qo'shildi` +
        (result.data.skipped > 0
          ? `, ${result.data.skipped} ta xato qator o'tkazib yuborildi`
          : ""),
    );
    return true;
  }

  async function handleVisibilitySave(input: VisibilityInput): Promise<string | null> {
    const id = await ensureSet();
    if (!id) return "Saqlanmadi";
    const result = await updateVisibility(id, input);
    if (!result.ok) return result.error;
    setVisibility(result.data.visibility);
    setHasPassword(result.data.hasPassword);
    toast.success("Ko'rinish sozlamasi saqlandi");
    return null;
  }

  async function handleFinish() {
    setFinishing(true);
    await flush();
    setFinishing(false);
    if (hasPendingChanges()) {
      toast.error("O'zgarishlar saqlanmadi. Qayta urinib ko'ring");
      return;
    }
    router.push(setIdRef.current ? `/sets/${setIdRef.current}` : "/library");
  }

  const announcements = useMemo<Announcements>(() => {
    const position = (id: string | number) =>
      stateRef.current.cards.findIndex((c) => c.id === id) + 1;
    return {
      onDragStart: ({ active }) => `${position(active.id)}-karta ko'tarildi`,
      onDragOver: ({ over }) =>
        over ? `Karta ${position(over.id)}-o'ringa ko'chirilmoqda` : "Karta ro'yxatdan tashqarida",
      onDragEnd: ({ over }) =>
        over ? `Karta ${position(over.id)}-o'ringa joylashtirildi` : "Karta joyiga qaytarildi",
      onDragCancel: () => "Ko'chirish bekor qilindi. Karta joyiga qaytarildi",
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const duplicates = useMemo(() => findDuplicateTerms(cards), [cards]);
  const completeCount = useMemo(() => cards.filter(isCardComplete).length, [cards]);
  const visibilityOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility);
  const VisibilityIconComponent = visibilityOption?.icon;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {setId ? "To'plamni tahrirlash" : "Yangi to'plam yaratish"}
          </h1>
          <SaveIndicator status={autosave.status} onRetry={() => void flush()} />
        </div>
        <Button variant="cta" size="lg" onClick={() => void handleFinish()} disabled={finishing}>
          Tayyor
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              schedule();
            }}
            maxLength={LIMITS.titleMax}
            placeholder={'Sarlavha, masalan: "Ingliz tili — 1-dars"'}
            aria-label="Sarlavha"
            className="h-12 text-lg font-semibold md:text-lg"
          />
        </div>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            schedule();
          }}
          maxLength={LIMITS.descriptionMax}
          placeholder="Tavsif qo'shing (ixtiyoriy)"
          aria-label="Tavsif"
          className="min-h-20"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <ClipboardPaste aria-hidden />
          Import
        </Button>
        <Button variant="outline" onClick={() => setPrivacyOpen(true)}>
          {VisibilityIconComponent && <VisibilityIconComponent aria-hidden />}
          Kimga ko&apos;rinadi: {visibilityOption?.label}
        </Button>
      </div>

      {completeCount < LIMITS.minCardsToStudy && (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
          O&apos;rganish uchun kamida {LIMITS.minCardsToStudy} ta to&apos;liq karta kerak.
        </p>
      )}

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Kartani ko'chirish uchun Probel tugmasini bosing, so'ng yuqori va pastki strelkalar bilan joyini tanlang. Joylashtirish uchun yana Probel, bekor qilish uchun Escape tugmasini bosing.",
          },
        }}
      >
        <SortableContext items={cards} strategy={verticalListSortingStrategy}>
          <ol ref={listRef} aria-label="Kartalar" className="grid gap-4">
            {cards.map((card, index) => (
              <CardRow
                key={card.id}
                card={card}
                index={index}
                isDuplicate={duplicates.has(card.term.trim().toLocaleLowerCase())}
                onChange={handleCardChange}
                onDelete={handleDelete}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={handleAdd}
        className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/40 font-semibold tracking-wide uppercase transition-colors hover:border-brand hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <Plus className="size-5" aria-hidden />
        So&apos;z qo&apos;shish
      </button>

      <div className="flex justify-end">
        <Button variant="cta" size="lg" onClick={() => void handleFinish()} disabled={finishing}>
          Tayyor
        </Button>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <PrivacyDialog
        open={privacyOpen}
        onOpenChange={setPrivacyOpen}
        visibility={visibility}
        hasPassword={hasPassword}
        onSave={handleVisibilitySave}
      />
    </div>
  );
}
