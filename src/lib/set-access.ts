import type { Visibility } from "@prisma/client";

export type AccessDecision = "allow" | "needs_password" | "not_found";

/**
 * Who may view a set: the owner always; members of a study group the set was added to;
 * others depending on visibility (and password unlock).
 */
export function decideSetAccess(
  set: { ownerId: string; visibility: Visibility },
  viewerId: string,
  unlocked: boolean,
  sharedViaGroup = false,
): AccessDecision {
  if (set.ownerId === viewerId || sharedViaGroup) return "allow";
  switch (set.visibility) {
    case "PUBLIC":
      return "allow";
    case "PASSWORD":
      return unlocked ? "allow" : "needs_password";
    case "PRIVATE":
      return "not_found";
  }
}
