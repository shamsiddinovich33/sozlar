"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";

import { signOutAction } from "@/app/(app)/actions";
import { UserAvatar } from "@/components/layout/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name: string | null;
  username: string | null;
  image: string | null;
};

export function UserMenu({ name, username, image }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Foydalanuvchi menyusi"
        className="cursor-pointer rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <UserAvatar name={name} image={image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">{name ?? username}</span>
          {username && (
            <span className="truncate text-xs font-normal text-muted-foreground">@{username}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound aria-hidden />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
          {isDark ? "Yorug' rejim" : "Qorong'i rejim"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void signOutAction()}>
          <LogOut aria-hidden />
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
