import "server-only";

import { cache } from "react";
import { Mastery, type GroupRole } from "@prisma/client";

import { db } from "@/lib/db";
import { groupProgressPercent } from "@/lib/groups";
import type { SetOwner, SetSummary } from "@/types/sets";

export type GroupListItem = {
  id: string;
  name: string;
  role: GroupRole;
  memberCount: number;
  setCount: number;
};

export async function getUserGroups(userId: string): Promise<GroupListItem[]> {
  const memberships = await db.groupMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    select: {
      role: true,
      group: {
        select: { id: true, name: true, _count: { select: { members: true, sets: true } } },
      },
    },
  });
  return memberships.map(({ role, group }) => ({
    id: group.id,
    name: group.name,
    role,
    memberCount: group._count.members,
    setCount: group._count.sets,
  }));
}

export type GroupSetItem = SetSummary & { addedBy: SetOwner; addedById: string };

export type GroupMemberItem = {
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: GroupRole;
  masteredCount: number;
  masteredPercent: number;
};

export type GroupDetail = {
  id: string;
  name: string;
  inviteToken: string;
  myRole: GroupRole;
  sets: GroupSetItem[];
  members: GroupMemberItem[];
  totalCards: number;
};

/** The group as seen by one of its members, or null if the user is not a member. */
export const getGroupForMember = cache(
  async (groupId: string, userId: string): Promise<GroupDetail | null> => {
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    if (!membership) return null;

    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        inviteToken: true,
        members: {
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          select: {
            role: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        sets: {
          orderBy: { addedAt: "desc" },
          select: {
            addedAt: true,
            addedBy: { select: { id: true, name: true, username: true, image: true } },
            set: {
              select: {
                id: true,
                title: true,
                visibility: true,
                ownerId: true,
                owner: { select: { name: true, username: true, image: true } },
                _count: { select: { cards: true } },
              },
            },
          },
        },
      },
    });
    if (!group) return null;

    const setIds = group.sets.map((s) => s.set.id);
    const memberIds = group.members.map((m) => m.user.id);
    const totalCards = group.sets.reduce((sum, s) => sum + s.set._count.cards, 0);
    const mastered =
      setIds.length === 0
        ? []
        : await db.cardProgress.groupBy({
            by: ["userId"],
            where: {
              userId: { in: memberIds },
              mastery: Mastery.MASTERED,
              card: { setId: { in: setIds } },
            },
            _count: { _all: true },
          });
    const masteredByUser = new Map(mastered.map((m) => [m.userId, m._count._all]));

    return {
      id: group.id,
      name: group.name,
      inviteToken: group.inviteToken,
      myRole: membership.role,
      totalCards,
      sets: group.sets.map(({ set, addedAt, addedBy }) => ({
        id: set.id,
        title: set.title,
        visibility: set.visibility,
        cardCount: set._count.cards,
        owner: set.owner,
        isOwner: set.ownerId === userId,
        activityAt: addedAt,
        addedById: addedBy.id,
        addedBy: { name: addedBy.name, username: addedBy.username, image: addedBy.image },
      })),
      members: group.members.map(({ role, user }) => {
        const masteredCount = masteredByUser.get(user.id) ?? 0;
        return {
          userId: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          role,
          masteredCount,
          masteredPercent: groupProgressPercent(masteredCount, totalCards),
        };
      }),
    };
  },
);

export type AddableSet = { id: string; title: string; cardCount: number; inGroup: boolean };

/** The user's own sets, newest first, marking those already in the group. */
export async function getAddableSets(groupId: string, userId: string): Promise<AddableSet[]> {
  const sets = await db.set.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      _count: { select: { cards: true } },
      groupSets: { where: { groupId }, select: { groupId: true } },
    },
  });
  return sets.map((s) => ({
    id: s.id,
    title: s.title,
    cardCount: s._count.cards,
    inGroup: s.groupSets.length > 0,
  }));
}

export async function getGroupByInvite(token: string, userId: string) {
  const group = await db.studyGroup.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      name: true,
      owner: { select: { name: true, username: true } },
      _count: { select: { members: true, sets: true } },
      members: { where: { userId }, select: { userId: true } },
    },
  });
  if (!group) return null;
  return {
    id: group.id,
    name: group.name,
    ownerName: group.owner.name ?? group.owner.username ?? "",
    memberCount: group._count.members,
    setCount: group._count.sets,
    isMember: group.members.length > 0,
  };
}
