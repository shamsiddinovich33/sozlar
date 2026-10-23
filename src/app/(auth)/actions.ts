"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/lib/auth";
import { AUTH_MESSAGES, RATE_LIMITED_CODE } from "@/lib/auth-errors";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { isPasswordResetAvailable, sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emails/password-reset";
import { hashPassword } from "@/lib/password";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
} from "@/lib/password-reset";
import {
  getClientIp,
  registerLimiter,
  resetEmailLimiter,
  resetRequestLimiter,
  resetSubmitLimiter,
} from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/redirect";
import { findTakenFields } from "@/lib/users";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validators/auth";
import type { FormActionResult } from "@/types/actions";

type LoginResult = FormActionResult<keyof LoginInput>;
type RegisterResult = FormActionResult<keyof RegisterInput>;

function credentialsErrorResult(error: AuthError): { ok: false; formError: string } {
  if (error instanceof CredentialsSignin) {
    return {
      ok: false,
      formError:
        error.code === RATE_LIMITED_CODE
          ? AUTH_MESSAGES.rateLimited
          : AUTH_MESSAGES.invalidCredentials,
    };
  }
  return { ok: false, formError: AUTH_MESSAGES.generic };
}

export async function loginAction(input: unknown, callbackUrl?: string): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, formError: AUTH_MESSAGES.invalidInput };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirectPath(callbackUrl),
    });
    return { ok: true };
  } catch (error) {
    // signIn throws a redirect on success; only Auth.js errors are handled here.
    if (error instanceof AuthError) return credentialsErrorResult(error);
    throw error;
  }
}

export async function registerAction(
  input: unknown,
  callbackUrl?: string,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, formError: AUTH_MESSAGES.invalidInput };
  const { name, username, email, password } = parsed.data;

  const ip = getClientIp(await headers());
  const { success } = await registerLimiter.limit(`register:${ip}`);
  if (!success) return { ok: false, formError: AUTH_MESSAGES.rateLimited };

  const taken = await findTakenFields(email, username);
  if (taken.length > 0) {
    return {
      ok: false,
      fieldErrors: {
        ...(taken.includes("email") && { email: AUTH_MESSAGES.emailTaken }),
        ...(taken.includes("username") && { username: AUTH_MESSAGES.usernameTaken }),
      },
    };
  }

  try {
    await db.user.create({
      data: { name, username, email, passwordHash: await hashPassword(password) },
    });
  } catch (error) {
    // Lost a race with a concurrent registration for the same email/username.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, formError: AUTH_MESSAGES.generic };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      identifier: email,
      password,
      redirectTo: safeRedirectPath(callbackUrl),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return credentialsErrorResult(error);
    throw error;
  }
}

export async function googleSignInAction(callbackUrl?: string): Promise<void> {
  await signIn("google", { redirectTo: safeRedirectPath(callbackUrl) });
}

/**
 * Emails a one-time reset link. The answer is the same whether or not the email has an account,
 * so the form cannot be used to find out who is registered.
 */
export async function requestPasswordReset(
  input: unknown,
): Promise<{ ok: true } | { ok: false; formError: string }> {
  if (!isPasswordResetAvailable()) return { ok: false, formError: AUTH_MESSAGES.generic };
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? AUTH_MESSAGES.invalidInput };
  }
  const { email } = parsed.data;

  const ip = getClientIp(await headers());
  const [byIp, byEmail] = await Promise.all([
    resetRequestLimiter.limit(`reset:${ip}`),
    resetEmailLimiter.limit(`reset:${email}`),
  ]);
  if (!byIp.success) return { ok: false, formError: AUTH_MESSAGES.rateLimited };
  // Over the per-address limit: silently skip sending, the reply stays the same.
  if (!byEmail.success) return { ok: true };

  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return { ok: true };

  const { token, tokenHash } = generateResetToken();
  await db.$transaction([
    // Only the newest link works.
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    }),
  ]);

  const link = `${await getAppUrl()}/reset-password/${token}`;
  try {
    await sendEmail({ to: email, ...passwordResetEmail({ name: user.name, link }) });
  } catch (error) {
    console.error("Password reset email failed", error);
  }
  return { ok: true };
}

/** Sets a new password from a reset link and signs the account out on every device. */
export async function resetPassword(
  input: unknown,
): Promise<{ ok: true } | { ok: false; formError: string }> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? AUTH_MESSAGES.invalidInput };
  }
  const ip = getClientIp(await headers());
  const { success } = await resetSubmitLimiter.limit(`reset-submit:${ip}`);
  if (!success) return { ok: false, formError: AUTH_MESSAGES.rateLimited };

  const { token, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const done = await db.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!row || !isResetTokenUsable(row)) return false;
    // Claim the token first so two parallel submits cannot both use it.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.passwordResetToken.deleteMany({ where: { userId: row.userId, id: { not: row.id } } });
    await tx.deviceSession.deleteMany({ where: { userId: row.userId } });
    return true;
  });
  if (!done) {
    return { ok: false, formError: "Havola yaroqsiz yoki muddati o'tgan. Yangi havola so'rang." };
  }
  return { ok: true };
}
