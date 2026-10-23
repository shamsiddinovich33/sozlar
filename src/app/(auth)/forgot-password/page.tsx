import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isPasswordResetAvailable } from "@/lib/email";

export const metadata: Metadata = { title: "Parolni tiklash" };

export default function ForgotPasswordPage() {
  if (!isPasswordResetAvailable()) notFound();
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold">Parolni tiklash</h1>
        <p className="text-sm text-muted-foreground">
          Hisobingizga bog&apos;langan emailni kiriting — yangi parol o&apos;rnatish havolasini
          yuboramiz.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        Parol esingizga tushdimi?{" "}
        <Link href="/login" className="font-semibold text-brand-text hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
