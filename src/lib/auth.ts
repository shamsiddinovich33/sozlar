import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/lib/auth.config";
import { RATE_LIMITED_CODE } from "@/lib/auth-errors";
import { db } from "@/lib/db";
import {
  DEVICE_CHECK_INTERVAL_MS,
  endDeviceSession,
  startDeviceSession,
  touchDeviceSession,
} from "@/lib/device-sessions";
import { verifyPassword } from "@/lib/password";
import { getClientIp, loginLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { generateUsername } from "@/lib/username";

class RateLimitedError extends CredentialsSignin {
  code = RATE_LIMITED_CODE;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({ allowDangerousEmailAccountLinking: false }),
    Credentials({
      credentials: {
        identifier: { label: "Email yoki foydalanuvchi nomi" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { success } = await loginLimiter.limit(`login:${getClientIp(request.headers)}`);
        if (!success) throw new RateLimitedError();

        const { identifier, password } = parsed.data;
        const user = await db.user.findFirst({
          where: identifier.includes("@") ? { email: identifier } : { username: identifier },
        });
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
        };
      },
    }),
  ],
  logger: {
    // Wrong passwords are expected; don't log them as server errors.
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error(error);
    },
  },
  events: {
    async signOut(message) {
      const sid = "token" in message ? message.token?.sid : undefined;
      if (sid) await endDeviceSession(sid);
    },
    // OAuth users are created by the adapter without a username: assign a unique one.
    async createUser({ user }) {
      if (!user.id || user.username) return;
      const username = await generateUsername(user.email ?? user.name ?? "user");
      await db.user.update({ where: { id: user.id }, data: { username } });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    session(params) {
      const session = authConfig.callbacks.session(params);
      if (params.token.sid) session.sessionId = params.token.sid;
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
        // A new sign-in: register this device so it can be listed and signed out remotely.
        token.sid = await startDeviceSession(user.id);
        token.sidCheckedAt = Date.now();
      } else if (
        token.id &&
        token.sid &&
        Date.now() - (token.sidCheckedAt ?? 0) > DEVICE_CHECK_INTERVAL_MS
      ) {
        // The device was signed out from another one (or expired): end this session.
        if (!(await touchDeviceSession(token.sid, token.id))) return null;
        token.sidCheckedAt = Date.now();
      }
      // After a profile change (unstable_update), reload the fields shown in the UI.
      if (trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: { name: true, email: true, image: true, username: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.picture = fresh.image;
          token.username = fresh.username;
        }
      }
      // First OAuth sign-in: username is assigned in `events.createUser` after the user object is built.
      if (token.id && !token.username) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { username: true },
        });
        token.username = dbUser?.username ?? null;
      }
      return token;
    },
  },
});
