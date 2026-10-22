import { describe, expect, it } from "vitest";

import { LIMITS } from "./limits";
import {
  IMPORT_ERRORS,
  looksLikeHeader,
  parseImport,
  validateImportOptions,
} from "./import-parser";

const tab = { termSeparator: "tab", cardSeparator: "newline" } as const;
const csv = { termSeparator: "comma", cardSeparator: "newline" } as const;

describe("parseImport", () => {
  it("parses tab-separated lines (Excel / Google Sheets paste)", () => {
    const result = parseImport("apple\tolma\nbook\tkitob\n", tab);
    expect(result.cards).toEqual([
      { term: "apple", definition: "olma" },
      { term: "book", definition: "kitob" },
    ]);
    expect(result.invalidCount).toBe(0);
  });

  it("handles CRLF, trims whitespace and skips blank lines", () => {
    const result = parseImport("  apple \t olma \r\n\r\n   \r\nbook\tkitob", tab);
    expect(result.cards).toEqual([
      { term: "apple", definition: "olma" },
      { term: "book", definition: "kitob" },
    ]);
    expect(result.rows.map((r) => r.row)).toEqual([1, 4]);
  });

  it("supports semicolon card separators", () => {
    const result = parseImport("a,1;b,2; c , 3 ;", {
      termSeparator: "comma",
      cardSeparator: "semicolon",
    });
    expect(result.cards).toEqual([
      { term: "a", definition: "1" },
      { term: "b", definition: "2" },
      { term: "c", definition: "3" },
    ]);
  });

  it("supports custom multi-character separators", () => {
    const result = parseImport("cat - mushuk || dog - it", {
      termSeparator: "custom",
      cardSeparator: "custom",
      customTermSeparator: " - ",
      customCardSeparator: "||",
    });
    expect(result.cards).toEqual([
      { term: "cat", definition: "mushuk" },
      { term: "dog", definition: "it" },
    ]);
  });

  it("keeps separators, newlines and escaped quotes inside quoted CSV fields", () => {
    const result = parseImport('"look up","qidirmoq, izlamoq"\n"say ""hi""","salom\nde"', csv);
    expect(result.cards).toEqual([
      { term: "look up", definition: "qidirmoq, izlamoq" },
      { term: 'say "hi"', definition: "salom\nde" },
    ]);
  });

  it("does not treat Uzbek apostrophes as quotes", () => {
    expect(parseImport("o'qimoq\tto read", tab).cards).toEqual([
      { term: "o'qimoq", definition: "to read" },
    ]);
  });

  it("joins extra fields into the definition", () => {
    expect(parseImport("apple,olma, sabzi", csv).cards).toEqual([
      { term: "apple", definition: "olma, sabzi" },
    ]);
  });

  it("flags invalid rows with a reason and excludes them from cards", () => {
    const long = "x".repeat(LIMITS.fieldMax + 1);
    const result = parseImport(`apple\nbook\t\n\tkitob\nok\tyes\n${long}\tz`, tab);
    expect(result.rows.map((r) => r.error)).toEqual([
      IMPORT_ERRORS.noSeparator,
      IMPORT_ERRORS.noDefinition,
      IMPORT_ERRORS.noTerm,
      null,
      IMPORT_ERRORS.tooLong,
    ]);
    expect(result.cards).toEqual([{ term: "ok", definition: "yes" }]);
    expect(result.invalidCount).toBe(4);
  });

  it("returns nothing for invalid options", () => {
    expect(parseImport("a\tb", { termSeparator: "custom", cardSeparator: "newline" }).rows).toEqual(
      [],
    );
  });
});

describe("validateImportOptions", () => {
  it("requires custom separators and distinct values", () => {
    expect(validateImportOptions(tab)).toBeNull();
    expect(
      validateImportOptions({ termSeparator: "custom", cardSeparator: "newline" }),
    ).not.toBeNull();
    expect(
      validateImportOptions({
        termSeparator: "custom",
        customTermSeparator: ";",
        cardSeparator: "semicolon",
      }),
    ).toBe("Ajratuvchilar bir xil bo'lmasligi kerak");
  });
});

describe("header rows", () => {
  it("skips the first non-blank row when asked", () => {
    const result = parseImport("\nterm,definition\napple,olma", { ...csv, skipHeader: true });
    expect(result.cards).toEqual([{ term: "apple", definition: "olma" }]);
    expect(result.rows.map((r) => r.row)).toEqual([3]);
  });

  it("detects common English and Uzbek headers", () => {
    expect(looksLikeHeader("term,definition\napple,olma", csv)).toBe(true);
    expect(looksLikeHeader("So\u2018z\tTarjima\napple\tolma", tab)).toBe(true);
    expect(looksLikeHeader("Word,Meaning\n", csv)).toBe(true);
    expect(looksLikeHeader("apple,olma\nbook,kitob", csv)).toBe(false);
    expect(looksLikeHeader("", csv)).toBe(false);
  });
});
