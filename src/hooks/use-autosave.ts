"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced, serialized saving: never runs two saves at once, and a change made while
 * a save is in flight triggers one more save afterwards. `save` should read the latest state itself.
 */
export function useAutosave(save: () => Promise<void>, delayMs = 800) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const saveRef = useRef(save);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const queuedRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const run = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return inFlightRef.current;
    }
    dirtyRef.current = false;
    setStatus("saving");
    const promise = saveRef.current().then(
      () => setStatus(dirtyRef.current ? "saving" : "saved"),
      () => {
        dirtyRef.current = true;
        setStatus("error");
      },
    );
    inFlightRef.current = promise;
    await promise;
    inFlightRef.current = null;
    if (queuedRef.current) {
      queuedRef.current = false;
      await run();
    }
  }, []);

  /** Marks state as changed and schedules a debounced save. */
  const schedule = useCallback(() => {
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void run();
    }, delayMs);
  }, [delayMs, run]);

  /** Saves immediately (cancelling any pending debounce) and waits for all saves to finish. */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (inFlightRef.current) {
      queuedRef.current = true;
      await inFlightRef.current;
      while (inFlightRef.current) await inFlightRef.current;
      return;
    }
    await run();
  }, [run]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const hasPendingChanges = useCallback(
    () => dirtyRef.current || timerRef.current !== null || inFlightRef.current !== null,
    [],
  );

  return { status, schedule, flush, hasPendingChanges };
}
