"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleFavorite } from "@/app/(app)/sets/study-actions";

/** Starred card ids with optimistic toggling; a failed save reverts that card. */
export function useFavorites(initialIds: readonly string[]) {
  const [starred, setStarred] = useState<ReadonlySet<string>>(() => new Set(initialIds));

  const setOne = useCallback((cardId: string, value: boolean) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (value) next.add(cardId);
      else next.delete(cardId);
      return next;
    });
  }, []);

  const mutation = useMutation({
    mutationFn: async (vars: { cardId: string; starred: boolean }) => {
      const result = await toggleFavorite(vars);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onMutate: (vars) => setOne(vars.cardId, vars.starred),
    onError: (error, vars) => {
      setOne(vars.cardId, !vars.starred);
      toast.error(error.message);
    },
  });

  const toggle = useCallback(
    (cardId: string) => mutation.mutate({ cardId, starred: !starred.has(cardId) }),
    [mutation, starred],
  );

  return { starred, toggle };
}
