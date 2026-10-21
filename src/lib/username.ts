import { db } from "@/lib/db";
import { USERNAME_REGEX } from "@/lib/validators/auth";

/** Turns an email or name into a username candidate matching USERNAME_REGEX (3–20 chars). */
export function toUsernameBase(source: string): string {
  const local = source.split("@")[0] ?? "";
  const cleaned = local
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 14);
  return cleaned.length >= 3 && USERNAME_REGEX.test(cleaned) ? cleaned : "user";
}

/** Generates a unique username, appending a random numeric suffix on collision. */
export async function generateUsername(source: string): Promise<string> {
  const base = toUsernameBase(source);
  let candidate = base;
  for (let attempt = 0; attempt < 10; attempt++) {
    const exists = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}${Date.now().toString().slice(-6)}`;
}
