import { z } from "zod";

import { DEFAULT_SET_TITLE, LIMITS } from "@/lib/limits";

export const cardIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, "Noto'g'ri identifikator");
export const setIdSchema = cardIdSchema;

const cardText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} bo'sh bo'lmasligi kerak`)
    .max(LIMITS.fieldMax, `${label} ${LIMITS.fieldMax} belgidan oshmasligi kerak`);

export const cardInputSchema = z.object({
  id: cardIdSchema,
  term: cardText("Atama"),
  definition: cardText("Tarjima"),
  position: z
    .number()
    .int()
    .min(0)
    .max(LIMITS.cardsPerSet * 2),
});

export const setDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .max(LIMITS.titleMax, `Sarlavha ${LIMITS.titleMax} belgidan oshmasligi kerak`)
    .transform((t) => t || DEFAULT_SET_TITLE),
  description: z
    .string()
    .trim()
    .max(LIMITS.descriptionMax, `Tavsif ${LIMITS.descriptionMax} belgidan oshmasligi kerak`)
    .transform((d) => d || null),
});

/** Incremental save: set details plus card changes since the last successful save. */
export const saveSetSchema = setDetailsSchema
  .extend({
    create: z.array(cardInputSchema).max(LIMITS.cardsPerSet),
    update: z.array(cardInputSchema).max(LIMITS.cardsPerSet),
    deleteIds: z.array(cardIdSchema).max(LIMITS.cardsPerSet),
  })
  .superRefine((value, ctx) => {
    const ids = [...value.create, ...value.update].map((c) => c.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Takroriy karta identifikatori" });
    }
  });

export type SaveSetInput = z.input<typeof saveSetSchema>;
export type CardInput = z.infer<typeof cardInputSchema>;

export const importOptionsSchema = z.object({
  termSeparator: z.enum(["tab", "comma", "custom"]),
  cardSeparator: z.enum(["newline", "semicolon", "custom"]),
  customTermSeparator: z.string().max(10).optional(),
  customCardSeparator: z.string().max(10).optional(),
});

export const importCardsSchema = z.object({
  text: z.string().max(LIMITS.importTextMax, "Matn juda katta"),
  options: importOptionsSchema,
});

export const visibilitySchema = z.discriminatedUnion("visibility", [
  z.object({ visibility: z.literal("PUBLIC") }),
  z.object({ visibility: z.literal("PRIVATE") }),
  z.object({
    visibility: z.literal("PASSWORD"),
    /** Empty keeps the current password (if any). */
    password: z
      .string()
      .max(LIMITS.setPasswordMax, `Parol ${LIMITS.setPasswordMax} belgidan oshmasligi kerak`)
      .refine((p) => p === "" || p.length >= LIMITS.setPasswordMin, {
        message: `Parol kamida ${LIMITS.setPasswordMin} ta belgi bo'lishi kerak`,
      }),
  }),
]);

export type VisibilityInput = z.infer<typeof visibilitySchema>;

export const unlockSetSchema = z.object({
  password: z.string().min(1, "Parolni kiriting").max(LIMITS.setPasswordMax),
});

export const favoriteSchema = z.object({ cardId: cardIdSchema, starred: z.boolean() });

export const studyModeSchema = z.enum(["FLASHCARDS", "LEARN"]);

export const finishSessionSchema = z.object({ sessionId: cardIdSchema });

export const submitAnswerSchema = z.object({
  setId: setIdSchema,
  cardId: cardIdSchema,
  correct: z.boolean(),
  /** Study session to count the answer in */
  sessionId: cardIdSchema.optional(),
});
