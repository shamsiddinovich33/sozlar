import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
};

/** Returns the signed-in user or redirects to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login");
  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}
