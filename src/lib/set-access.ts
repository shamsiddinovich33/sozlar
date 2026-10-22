import type { Visibility } from "@prisma/client";

export type AccessDecision = "allow" | "needs_password" | "not_found";

/** Who may view a set: the owner always; others depending on visibility (and password unlock). */
export function decideSetAccess(
  set: { ownerId: string; visibility: Visibility },
  viewerId: string,
  unlocked: boolean,
): AccessDecision {
  if (set.ownerId === viewerId) return "allow";
  switch (set.visibility) {
    case "PUBLIC":
      return "allow";
    case "PASSWORD":
      return unlocked ? "allow" : "needs_password";
    case "PRIVATE":
      return "not_found";
  }
}
