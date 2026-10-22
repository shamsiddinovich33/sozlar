import type { Visibility } from "@prisma/client";

export type SetOwner = {
  name: string | null;
  username: string | null;
  image: string | null;
};

export type SetSummary = {
  id: string;
  title: string;
  visibility: Visibility;
  cardCount: number;
  owner: SetOwner;
  isOwner: boolean;
  /** Last edit (owned sets) or last study session, whichever is newer. */
  activityAt: Date;
};

export type ContinueSet = SetSummary & {
  masteredCount: number;
  masteredPercent: number;
};
