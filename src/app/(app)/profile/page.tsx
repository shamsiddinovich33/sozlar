import type { Metadata } from "next";

import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profil" };

// Placeholder; the full profile page is built in Step 7.
export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-bold sm:text-3xl">{user.name ?? user.username}</h1>
      {user.username && <p className="text-muted-foreground">@{user.username}</p>}
    </div>
  );
}
