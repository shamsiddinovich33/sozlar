import { Button } from "@/components/ui/button";

// Temporary placeholder; the landing page is built in Step 2.
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">So&apos;zlik</h1>
      <p className="max-w-md text-muted-foreground">
        So&apos;zlarni kartochkalar va aqlli o&apos;rganish rejimi bilan yodlang.
      </p>
      <div className="flex gap-3">
        <Button variant="cta" size="lg">
          Bepul boshlash
        </Button>
        <Button variant="outline" size="lg">
          Kirish
        </Button>
      </div>
    </main>
  );
}
