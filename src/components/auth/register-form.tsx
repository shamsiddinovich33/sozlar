"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { registerAction } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction(values, callbackUrl);
      if (!result || result.ok) return;
      setFormError(result.formError ?? null);
      const fieldErrors = Object.entries(result.fieldErrors ?? {}) as [
        keyof RegisterInput,
        string,
      ][];
      fieldErrors.forEach(([field, message], i) =>
        form.setError(field, { message }, { shouldFocus: i === 0 }),
      );
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormAlert message={formError} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ism</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Ali Valiyev" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foydalanuvchi nomi</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="ali_valiyev"
                  {...field}
                />
              </FormControl>
              <FormDescription>Lotin harflari, raqamlar va _ belgisi</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="ali@example.com" {...field} />
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
              <FormLabel>Parol</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>Kamida 8 ta belgi</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="cta" size="lg" className="mt-2 w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          Ro&apos;yxatdan o&apos;tish
        </Button>
      </form>
    </Form>
  );
}
