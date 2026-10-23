import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { hashResetToken, isResetTokenUsable } from "@/lib/password-reset";
import { resetTokenSchema } from "@/lib/validators/auth";

export const metadata: Metadata = {
  title: "Yangi parol",
  // The token is in the URL: never leak it to other sites or search engines.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

async function isLinkValid(token: string): Promise<boolean> {
  if (!resetTokenSchema.safeParse(token).success) return false;
  const row = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { expiresAt: true, usedAt: true },
  });
  return isResetTokenUsable(row);
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!(await isLinkValid(token))) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="text-2xl font-bold">Havola yaroqsiz</h1>
        <p className="text-sm text-muted-foreground">
          Bu havola muddati o&apos;tgan, allaqachon ishlatilgan yoki noto&apos;g&apos;ri. Yangi
          havola so&apos;rang.
        </p>
        <Button asChild>
          <Link href="/forgot-password">Yangi havola olish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold">Yangi parol o&apos;rnating</h1>
        <p className="text-sm text-muted-foreground">
          Parol o&apos;zgargach, barcha qurilmalar akkauntdan chiqariladi.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
