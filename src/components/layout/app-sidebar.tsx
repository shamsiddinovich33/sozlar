"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { LexaMark } from "@/components/brand/lexa-mark";
import { Logo } from "@/components/layout/logo";
import { NAV_ITEMS, isNavActive } from "@/components/layout/nav-items";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-cookie";
import { cn } from "@/lib/utils";

export function AppSidebar({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border/60 bg-background transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "px-5")}>
        {collapsed ? (
          <Link
            href="/dashboard"
            aria-label="Lexa — bosh sahifa"
            className="grid size-10 place-items-center rounded-lg"
          >
            <LexaMark className="size-8 text-logo" />
          </Link>
        ) : (
          <Logo href="/dashboard" />
        )}
      </div>

      <nav aria-label="Asosiy menyu" className="flex-1 px-3 py-2">
        <ul className="grid gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-5 shrink-0", active && "text-brand-text")}
                    aria-hidden
                  />
                  <span className={cn(collapsed && "sr-only")}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Menyuni kengaytirish" : "Menyuni yig'ish"}
          aria-expanded={!collapsed}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-5" aria-hidden />
              Yig&apos;ish
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
