import { z } from "zod";

import { registerSchema, usernameSchema } from "@/lib/validators/auth";

export const profileSchema = z.object({
  name: registerSchema.shape.name,
  username: usernameSchema,
  email: registerSchema.shape.email,
});

export const changePasswordSchema = z
  .object({
    /** Empty for accounts that never had a password (Google sign-in). */
    currentPassword: z.string().max(72),
    newPassword: registerSchema.shape.password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Yangi parol joriy paroldan farq qilishi kerak",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  confirmUsername: z.string().trim().toLowerCase().min(1, "Foydalanuvchi nomini kiriting"),
  password: z.string().max(72),
});

export const avatarSchema = z.object({ url: z.string().max(500) });

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
