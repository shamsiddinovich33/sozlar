import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CreateSetFab } from "@/components/layout/create-set-fab";
import { Logo } from "@/components/layout/logo";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-cookie";
import { UserMenu } from "@/components/layout/user-menu";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { name, username, image } = await requireUser();
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Asosiy tarkibga o&apos;tish
      </a>
      <AppSidebar defaultCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Logo href="/dashboard" className="md:invisible" />
          <UserMenu name={name} username={username} image={image} />
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-12"
        >
          {children}
        </main>
      </div>
      <CreateSetFab />
      <MobileTabBar />
    </div>
  );
}
