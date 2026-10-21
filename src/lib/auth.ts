import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getClientIp, loginLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { generateUsername } from "@/lib/username";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (!success) return null;

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
  events: {
    // OAuth users are created by the adapter without a username: assign a unique one.
    async createUser({ user }) {
      if (!user.id || user.username) return;
      const username = await generateUsername(user.email ?? user.name ?? "user");
      await db.user.update({ where: { id: user.id }, data: { username } });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
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
