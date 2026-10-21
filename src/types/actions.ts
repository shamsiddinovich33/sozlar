/** Result returned by form Server Actions. A successful auth action redirects instead of returning. */
export type FormActionResult<TField extends string> =
  | { ok: true }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Partial<Record<TField, string>>;
    };
