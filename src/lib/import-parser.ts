import { LIMITS } from "@/lib/limits";

export type TermSeparator = "tab" | "comma" | "custom";
export type CardSeparator = "newline" | "semicolon" | "custom";

export type ImportOptions = {
  termSeparator: TermSeparator;
  cardSeparator: CardSeparator;
  customTermSeparator?: string;
  customCardSeparator?: string;
};

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  termSeparator: "tab",
  cardSeparator: "newline",
};

export type ParsedRow = {
  /** 1-based row number among non-blank rows' source rows */
  row: number;
  term: string;
  definition: string;
  error: string | null;
};

export type ParseResult = {
  rows: ParsedRow[];
  cards: { term: string; definition: string }[];
  invalidCount: number;
};

export const IMPORT_ERRORS = {
  noSeparator: "Ajratuvchi topilmadi",
  noTerm: "Atama yo'q",
  noDefinition: "Tarjima yo'q",
  tooLong: `Juda uzun (${LIMITS.fieldMax} belgidan oshmasin)`,
} as const;

const NEWLINE = "\n";

function resolveTermSeparator(options: ImportOptions): string | null {
  if (options.termSeparator === "tab") return "\t";
  if (options.termSeparator === "comma") return ",";
  return options.customTermSeparator || null;
}

function resolveCardSeparator(options: ImportOptions): string | null {
  if (options.cardSeparator === "newline") return NEWLINE;
  if (options.cardSeparator === "semicolon") return ";";
  return options.customCardSeparator || null;
}

/** Checks that both separators are set and distinct. */
export function validateImportOptions(options: ImportOptions): string | null {
  const termSep = resolveTermSeparator(options);
  const cardSep = resolveCardSeparator(options);
  if (!termSep) return "Atama va tarjima orasidagi ajratuvchini kiriting";
  if (!cardSep) return "Kartalar orasidagi ajratuvchini kiriting";
  if (termSep === cardSep) return "Ajratuvchilar bir xil bo'lmasligi kerak";
  return null;
}

/**
 * Splits text into rows of fields. Fields may be wrapped in double quotes (CSV / spreadsheet style),
 * in which case separators and newlines inside them are kept and `""` is an escaped quote.
 */
function tokenize(text: string, termSep: string, cardSep: string): string[][] {
  const input = text.replace(/\r\n?/g, NEWLINE);
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let atFieldStart = true;

  const endField = () => {
    fields.push(field);
    field = "";
    atFieldStart = true;
  };
  const endRow = () => {
    endField();
    rows.push(fields);
    fields = [];
  };

  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (atFieldStart && ch === '"') {
      inQuotes = true;
      atFieldStart = false;
      i += 1;
      continue;
    }
    if (input.startsWith(cardSep, i)) {
      endRow();
      i += cardSep.length;
      continue;
    }
    if (input.startsWith(termSep, i)) {
      endField();
      i += termSep.length;
      continue;
    }
    field += ch;
    atFieldStart = false;
    i += 1;
  }
  endRow();
  return rows;
}

/** Parses pasted text or CSV into cards. Blank rows are skipped; invalid rows carry an Uzbek error. */
export function parseImport(text: string, options: ImportOptions): ParseResult {
  const termSep = resolveTermSeparator(options);
  const cardSep = resolveCardSeparator(options);
  if (!termSep || !cardSep || termSep === cardSep) return { rows: [], cards: [], invalidCount: 0 };

  const rows: ParsedRow[] = [];
  tokenize(text, termSep, cardSep).forEach((fields, index) => {
    if (fields.every((f) => f.trim() === "")) return;

    const term = (fields[0] ?? "").trim();
    // Extra separators belong to the definition (e.g. "apple, olma, sabzi").
    const definition = fields.slice(1).join(termSep).trim();

    let error: string | null = null;
    if (fields.length < 2) error = IMPORT_ERRORS.noSeparator;
    else if (!term) error = IMPORT_ERRORS.noTerm;
    else if (!definition) error = IMPORT_ERRORS.noDefinition;
    else if (term.length > LIMITS.fieldMax || definition.length > LIMITS.fieldMax) {
      error = IMPORT_ERRORS.tooLong;
    }
    rows.push({ row: index + 1, term, definition, error });
  });

  const cards = rows
    .filter((r) => r.error === null)
    .map(({ term, definition }) => ({ term, definition }));
  return { rows, cards, invalidCount: rows.length - cards.length };
}
