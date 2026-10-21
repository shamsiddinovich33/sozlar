import type { Metadata } from "next";
import Link from "next/link";

import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold">Bepul ro&apos;yxatdan o&apos;ting</h1>
        <p className="text-sm text-muted-foreground">
          So&apos;z to&apos;plamlaringizni yarating va tezroq yodlang
        </p>
      </div>
      <GoogleButton label="Google orqali ro'yxatdan o'tish" />
      <AuthDivider />
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
