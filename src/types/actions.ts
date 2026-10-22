/** Result returned by form Server Actions. A successful auth action redirects instead of returning. */
export type FormActionResult<TField extends string> =
  | { ok: true }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Partial<Record<TField, string>>;
    };

/** Result returned by data-mutating Server Actions. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
