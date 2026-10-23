import type { GroupRole } from "@prisma/client";

export const MAX_GROUP_MEMBERS = 15;
export const GROUP_NAME_MAX = 60;

export const GROUP_ERRORS = {
  notFound: "Guruh topilmadi",
  ownerOnly: "Bu amalni faqat guruh egasi bajara oladi",
  full: `Guruh to'lgan (ko'pi bilan ${MAX_GROUP_MEMBERS} a'zo)`,
  ownerCannotLeave: "Guruh egasi guruhdan chiqa olmaydi. Guruhni o'chirishingiz mumkin",
  cannotRemoveSelf: "O'zingizni guruhdan chiqara olmaysiz",
  notYourSet: "Faqat o'zingizning to'plamlaringizni qo'sha olasiz",
  cannotRemoveSet: "Bu to'plamni faqat uni qo'shgan a'zo yoki guruh egasi olib tashlay oladi",
} as const;

/** The owner can remove any set; a member only the sets they added. */
export function canRemoveGroupSet(role: GroupRole, addedById: string, userId: string): boolean {
  return role === "OWNER" || addedById === userId;
}

export function canJoin(memberCount: number): boolean {
  return memberCount < MAX_GROUP_MEMBERS;
}

/** Share of mastered cards, 0–100 (0 when the group has no cards). */
export function groupProgressPercent(mastered: number, total: number): number {
  return total === 0 ? 0 : Math.round((Math.min(mastered, total) / total) * 100);
}
