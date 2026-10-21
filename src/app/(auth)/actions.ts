"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/lib/auth";
import { AUTH_MESSAGES, RATE_LIMITED_CODE } from "@/lib/auth-errors";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getClientIp, registerLimiter } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/redirect";
import { findTakenFields } from "@/lib/users";
import {
  loginSchema,
  registerSchema,
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

export async function registerAction(input: unknown): Promise<RegisterResult> {
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
      redirectTo: safeRedirectPath(null),
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
