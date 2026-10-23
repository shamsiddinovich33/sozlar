"use server";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { ACTION_ERRORS, ActionError, requireUserId, runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { GROUP_ERRORS, canJoin, canRemoveGroupSet } from "@/lib/groups";
import {
  addGroupSetsSchema,
  groupIdSchema,
  groupMemberSchema,
  groupNameSchema,
  groupSetSchema,
  inviteTokenSchema,
} from "@/lib/validators/groups";
import type { ActionResult } from "@/types/actions";

function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** The caller's role in the group; throws if they are not a member. */
async function requireMembership(
  groupId: string,
  userId: string,
  client: Prisma.TransactionClient = db,
) {
  const membership = await client.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  if (!membership) throw new ActionError(GROUP_ERRORS.notFound);
  return membership.role;
}

async function requireOwner(groupId: string, userId: string): Promise<void> {
  if ((await requireMembership(groupId, userId)) !== "OWNER") {
    throw new ActionError(GROUP_ERRORS.ownerOnly);
  }
}

export async function createGroup(name: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const groupName = groupNameSchema.parse(name);
    return db.studyGroup.create({
      data: {
        name: groupName,
        ownerId: userId,
        inviteToken: newInviteToken(),
        members: { create: { userId, role: "OWNER" } },
      },
      select: { id: true },
    });
  });
}

export async function renameGroup(groupId: unknown, name: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = groupIdSchema.parse(groupId);
    const groupName = groupNameSchema.parse(name);
    await requireOwner(id, userId);
    await db.studyGroup.update({ where: { id }, data: { name: groupName } });
    return null;
  });
}

/** Replaces the invite link; previously shared links stop working. */
export async function regenerateInvite(groupId: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = groupIdSchema.parse(groupId);
    await requireOwner(id, userId);
    await db.studyGroup.update({ where: { id }, data: { inviteToken: newInviteToken() } });
    return null;
  });
}

export async function deleteGroup(groupId: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = groupIdSchema.parse(groupId);
    await requireOwner(id, userId);
    await db.studyGroup.delete({ where: { id } });
    return null;
  });
}

/** Joins via invite link. Joining a group you are already in is a no-op. */
export async function joinGroup(token: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const inviteToken = inviteTokenSchema.safeParse(token);
    if (!inviteToken.success) throw new ActionError(GROUP_ERRORS.notFound);

    return db.$transaction(async (tx) => {
      const group = await tx.studyGroup.findUnique({
        where: { inviteToken: inviteToken.data },
        select: { id: true },
      });
      if (!group) throw new ActionError(GROUP_ERRORS.notFound);
      // Lock the group row so two people can't both take the last free place.
      await tx.$executeRaw`SELECT 1 FROM "StudyGroup" WHERE id = ${group.id} FOR UPDATE`;

      const existing = await tx.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId } },
        select: { userId: true },
      });
      if (existing) return group;
      const count = await tx.groupMember.count({ where: { groupId: group.id } });
      if (!canJoin(count)) throw new ActionError(GROUP_ERRORS.full);
      await tx.groupMember.create({ data: { groupId: group.id, userId } });
      return group;
    });
  });
}

export async function leaveGroup(groupId: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const id = groupIdSchema.parse(groupId);
    if ((await requireMembership(id, userId)) === "OWNER") {
      throw new ActionError(GROUP_ERRORS.ownerCannotLeave);
    }
    // The sets this member shared leave the group with them.
    await db.$transaction([
      db.groupSet.deleteMany({ where: { groupId: id, addedById: userId } }),
      db.groupMember.delete({ where: { groupId_userId: { groupId: id, userId } } }),
    ]);
    return null;
  });
}

export async function removeMember(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { groupId, userId: memberId } = groupMemberSchema.parse(input);
    await requireOwner(groupId, userId);
    if (memberId === userId) throw new ActionError(GROUP_ERRORS.cannotRemoveSelf);
    const { count } = await db.groupMember.deleteMany({ where: { groupId, userId: memberId } });
    if (count === 0) throw new ActionError(ACTION_ERRORS.notFound);
    await db.groupSet.deleteMany({ where: { groupId, addedById: memberId } });
    return null;
  });
}

/** Adds the caller's own sets to the group (sets already there are skipped). */
export async function addSetsToGroup(input: unknown): Promise<ActionResult<{ added: number }>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { groupId, setIds } = addGroupSetsSchema.parse(input);
    await requireMembership(groupId, userId);
    const unique = [...new Set(setIds)];
    const owned = await db.set.count({ where: { id: { in: unique }, ownerId: userId } });
    if (owned !== unique.length) throw new ActionError(GROUP_ERRORS.notYourSet);
    const { count } = await db.groupSet.createMany({
      data: unique.map((setId) => ({ groupId, setId, addedById: userId })),
      skipDuplicates: true,
    });
    return { added: count };
  });
}

export async function removeSetFromGroup(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { groupId, setId } = groupSetSchema.parse(input);
    const role = await requireMembership(groupId, userId);
    const entry = await db.groupSet.findUnique({
      where: { groupId_setId: { groupId, setId } },
      select: { addedById: true },
    });
    if (!entry) throw new ActionError(ACTION_ERRORS.notFound);
    if (!canRemoveGroupSet(role, entry.addedById, userId)) {
      throw new ActionError(GROUP_ERRORS.cannotRemoveSet);
    }
    await db.groupSet.delete({ where: { groupId_setId: { groupId, setId } } });
    return null;
  });
}
