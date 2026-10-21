import { z } from "zod";

export const USERNAME_REGEX = /^[a-z0-9_]+$/;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email kiritilishi shart")
  .pipe(z.email("Email manzil noto'g'ri"));

const password = z
  .string()
  .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
  .max(72, "Parol 72 ta belgidan oshmasligi kerak");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak")
  .max(20, "Foydalanuvchi nomi 20 ta belgidan oshmasligi kerak")
  .regex(USERNAME_REGEX, "Faqat lotin harflari, raqamlar va _ belgisi ishlatilishi mumkin");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ism kamida 2 ta belgi bo'lishi kerak")
    .max(50, "Ism 50 ta belgidan oshmasligi kerak"),
  username: usernameSchema,
  email,
  password,
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, "Email yoki foydalanuvchi nomini kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
