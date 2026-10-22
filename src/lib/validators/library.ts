import { z } from "zod";

export const LIBRARY_SORTS = ["recent", "az"] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];

/** Parses library URL search params; invalid values fall back to defaults instead of erroring. */
export const librarySearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((v) => v || undefined),
  sort: z.enum(LIBRARY_SORTS).catch("recent").default("recent"),
});

export type LibrarySearch = z.infer<typeof librarySearchSchema>;
