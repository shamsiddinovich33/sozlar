"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { loginAction } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

type LoginFormProps = {
  callbackUrl?: string;
  initialError?: string | null;
  /** Shows the "Parolni unutdingizmi?" link */
  canResetPassword?: boolean;
  /** Success note after a password reset */
  notice?: string | null;
};

export function LoginForm({
  callbackUrl,
  initialError,
  canResetPassword = false,
  notice,
}: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values, callbackUrl);
      if (result && !result.ok) {
        setFormError(result.formError ?? null);
        form.setFocus("password");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {notice && !formError && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-success-text"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{notice}</span>
          </div>
        )}
        <FormAlert message={formError} />
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email yoki foydalanuvchi nomi</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="ali@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Parol</FormLabel>
                {canResetPassword && (
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-brand-text hover:underline"
                  >
                    Parolni unutdingizmi?
                  </Link>
                )}
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          Kirish
        </Button>
      </form>
    </Form>
  );
}
