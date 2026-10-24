import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, ClipboardPaste, Layers, TrendingUp, type LucideIcon } from "lucide-react";

import { DemoFlashcard } from "@/components/flashcard/demo-flashcard";
import { Faq } from "@/components/landing/faq";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Lexa — xorijiy so'zlarni oson yodlang" },
  alternates: { canonical: "/" },
};

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Layers,
    title: "Flashcards",
    text: "Kartani aylantiring, talaffuzni tinglang va bilgan-bilmagan so'zlaringizni belgilang.",
  },
  {
    icon: BrainCircuit,
    title: "Aqlli o'rganish",
    text: "Xato qilgan so'zlaringiz ko'proq, yaxshi bilganlaringiz kamroq takrorlanadi.",
  },
  {
    icon: ClipboardPaste,
    title: "Ommaviy import",
    text: "Excel, Word yoki Google Docs'dan yuzlab so'zni bir zumda ko'chirib oling.",
  },
  {
    icon: TrendingUp,
    title: "Progress kuzatuv",
    text: "Har bir so'z bo'yicha natija, kunlik seriya va haftalik faollikni kuzating.",
  },
];

const STEPS = [
  {
    title: "To'plam yarating",
    text: "So'zlarni birma-bir qo'shing yoki ro'yxatni bir martada import qiling.",
  },
  {
    title: "Kartochkalar bilan tanishing",
    text: "Kartalarni aylantirib, yangi so'zlarni ko'rib chiqing va talaffuzini eshiting.",
  },
  {
    title: "Aqlli rejimda yodlang",
    text: "Test va yozma savollar orqali barcha so'zlar \"o'zlashtirildi\" bo'lguncha mashq qiling.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div className="grid gap-6 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              So&apos;zlarni <span className="text-brand-text">tezroq</span> va{" "}
              <span className="text-amber-700 dark:text-accent-yellow">mustahkam</span> yodlang
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              Kartochkalar va xatolaringizga moslashadigan aqlli o&apos;rganish rejimi bilan xorijiy
              tildagi so&apos;z boyligingizni oshiring.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild variant="cta" size="lg">
                <Link href="/register">Bepul boshlash</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Kirish</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <DemoFlashcard />
          </div>
        </section>

        {/* Features */}
        <section
          id="imkoniyatlar"
          aria-labelledby="features-title"
          className="scroll-mt-20 bg-secondary/40 py-16 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="features-title"
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            >
              O&apos;rganish uchun kerakli hamma narsa
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="rounded-xl bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand-text">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="qanday-ishlaydi"
          aria-labelledby="how-title"
          className="scroll-mt-20 py-16 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="how-title"
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Qanday ishlaydi
            </h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="grid justify-items-center gap-3 text-center">
                  <span
                    aria-hidden
                    className="grid size-12 place-items-center rounded-full bg-accent-yellow text-lg font-bold text-navy"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="savollar"
          aria-labelledby="faq-title"
          className="scroll-mt-20 bg-secondary/40 py-16 md:py-24"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2
              id="faq-title"
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Ko&apos;p beriladigan savollar
            </h2>
            <div className="mt-10 rounded-xl bg-card px-6 py-2">
              <Faq />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 text-center md:py-24">
          <div className="mx-auto grid max-w-2xl justify-items-center gap-6 px-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Bugundan boshlang</h2>
            <p className="text-muted-foreground">
              Birinchi to&apos;plamingizni bir daqiqada yarating — bepul.
            </p>
            <Button asChild variant="cta" size="lg">
              <Link href="/register">Bepul boshlash</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
