import type { Metadata } from "next";
import Link from "next/link";

import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "Kirish" };

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = first(params.callbackUrl);
  const initialError = getAuthErrorMessage(first(params.error));

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold">Xush kelibsiz!</h1>
        <p className="text-sm text-muted-foreground">
          Hisobingizga kiring va o&apos;rganishni davom ettiring
        </p>
      </div>
      <GoogleButton callbackUrl={callbackUrl} />
      <AuthDivider />
      <LoginForm callbackUrl={callbackUrl} initialError={initialError} />
      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/register" className="font-semibold text-brand-text hover:underline">
          Ro&apos;yxatdan o&apos;ting
        </Link>
      </p>
    </div>
  );
}
