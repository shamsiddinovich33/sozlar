"use server";

import { Prisma } from "@prisma/client";

import { ACTION_ERRORS, ActionError, requireUserId, runAction } from "@/lib/action";
import { signOut, unstable_update } from "@/lib/auth";
import { AUTH_MESSAGES } from "@/lib/auth-errors";
import {
  avatarUploadParams,
  getCloudinaryConfig,
  isOwnAvatarUrl,
  signCloudinaryParams,
} from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { accountLimiter } from "@/lib/rate-limit";
import { findTakenFields } from "@/lib/users";
import {
  avatarSchema,
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
  type ProfileInput,
} from "@/lib/validators/profile";
import type { ActionResult, FormActionResult } from "@/types/actions";

async function refreshSession(): Promise<void> {
  await unstable_update({});
}

async function assertNotRateLimited(userId: string): Promise<void> {
  const { success } = await accountLimiter.limit(userId);
  if (!success) throw new ActionError(AUTH_MESSAGES.rateLimited);
}

export async function updateProfile(input: unknown): Promise<FormActionResult<keyof ProfileInput>> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const data = profileSchema.parse(input);
    const taken = await findTakenFields(data.email, data.username, userId);
    if (taken.length > 0) return { taken };
    try {
      await db.user.update({ where: { id: userId }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ActionError(ACTION_ERRORS.generic);
      }
      throw error;
    }
    await refreshSession();
    return { taken: [] };
  });

  if (!result.ok) return { ok: false, formError: result.error };
  if (result.data.taken.length > 0) {
    return {
      ok: false,
      fieldErrors: {
        ...(result.data.taken.includes("email") && { email: AUTH_MESSAGES.emailTaken }),
        ...(result.data.taken.includes("username") && { username: AUTH_MESSAGES.usernameTaken }),
      },
    };
  }
  return { ok: true };
}

export async function changePassword(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { currentPassword, newPassword } = changePasswordSchema.parse(input);
    await assertNotRateLimited(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new ActionError(ACTION_ERRORS.unauthenticated);
    if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new ActionError("Joriy parol noto'g'ri");
    }
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return null;
  });
}

/** Deletes the account and everything it owns, then signs out. */
export async function deleteAccount(input: unknown): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const { confirmUsername, password } = deleteAccountSchema.parse(input);
    await assertNotRateLimited(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { username: true, passwordHash: true },
    });
    if (!user) throw new ActionError(ACTION_ERRORS.unauthenticated);
    if (confirmUsername !== user.username) {
      throw new ActionError("Foydalanuvchi nomi mos kelmadi");
    }
    if (user.passwordHash && !(await verifyPassword(password, user.passwordHash))) {
      throw new ActionError("Parol noto'g'ri");
    }
    await db.user.delete({ where: { id: userId } });
    return null;
  });
  // signOut redirects by throwing, so it must run outside runAction.
  if (result.ok) await signOut({ redirectTo: "/" });
  return result;
}

export type AvatarUploadParams = {
  uploadUrl: string;
  fields: Record<string, string>;
};

/** Signed parameters for uploading the avatar straight from the browser to Cloudinary. */
export async function getAvatarUploadParams(): Promise<ActionResult<AvatarUploadParams>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const config = getCloudinaryConfig();
    if (!config) throw new ActionError("Rasm yuklash hozircha sozlanmagan");
    const params = avatarUploadParams(userId, Math.floor(Date.now() / 1000));
    const signature = signCloudinaryParams(params, config.apiSecret);
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      fields: {
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        api_key: config.apiKey,
        signature,
      },
    };
  });
}

export async function setAvatar(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    const { url } = avatarSchema.parse(input);
    const config = getCloudinaryConfig();
    if (!config || !isOwnAvatarUrl(url, config.cloudName, userId)) {
      throw new ActionError(ACTION_ERRORS.invalid);
    }
    await db.user.update({ where: { id: userId }, data: { image: url } });
    await refreshSession();
    return null;
  });
}

export async function removeAvatar(): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId();
    await db.user.update({ where: { id: userId }, data: { image: null } });
    await refreshSession();
    return null;
  });
}
