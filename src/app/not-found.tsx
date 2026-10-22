import type { Metadata } from "next";

import { NotFoundContent } from "@/components/feedback/not-found-content";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Sahifa topilmadi" };

export default async function NotFound() {
  const session = await auth();
  return (
    <main className="px-4">
      <NotFoundContent signedIn={!!session?.user} />
    </main>
  );
}
