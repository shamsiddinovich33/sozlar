"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
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
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.ok) setSentTo(values.email);
      else setFormError(result.formError);
    });
  }

  if (sentTo) {
    return (
      <div role="status" className="grid justify-items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success-text">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <p className="font-semibold">Emailingizni tekshiring</p>
        <p className="text-sm text-muted-foreground">
          Agar <span className="font-semibold text-foreground">{sentTo}</span> manzili bilan hisob
          bo&apos;lsa, unga parolni tiklash havolasi yuborildi. Havola 1 soat ishlaydi. Xat kelmasa,
          &quot;Spam&quot; papkasini ham ko&apos;ring.
        </p>
        <Button variant="outline" onClick={() => setSentTo(null)}>
          Boshqa email kiritish
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormAlert message={formError} />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="ali@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          Havola yuborish
        </Button>
      </form>
    </Form>
  );
}
