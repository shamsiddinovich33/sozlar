/** Custom `code` values thrown from the Credentials `authorize` callback. */
export const RATE_LIMITED_CODE = "rate_limited";

export const AUTH_MESSAGES = {
  invalidCredentials: "Login yoki parol noto'g'ri",
  rateLimited: "Juda ko'p urinish. Iltimos, birozdan so'ng qayta urinib ko'ring",
  generic: "Nimadir xato ketdi. Iltimos, qayta urinib ko'ring",
  emailTaken: "Bu email allaqachon ro'yxatdan o'tgan",
  usernameTaken: "Bu foydalanuvchi nomi band",
  invalidInput: "Ma'lumotlarni to'g'ri kiriting",
} as const;

/** Maps an Auth.js `?error=` query value to a user-facing Uzbek message. */
export function getAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "CredentialsSignin":
      return AUTH_MESSAGES.invalidCredentials;
    case "OAuthAccountNotLinked":
      return "Bu email boshqa usul bilan ro'yxatdan o'tgan. Iltimos, avval o'sha usul bilan kiring";
    case "AccessDenied":
      return "Kirishga ruxsat berilmadi";
    case "Configuration":
      return "Google orqali kirish hozircha sozlanmagan";
    default:
      return AUTH_MESSAGES.generic;
  }
}
