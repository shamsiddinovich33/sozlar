import { House, Library, UserRound, UsersRound, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: House },
  { href: "/library", label: "Kutubxonam", icon: Library },
  { href: "/groups", label: "Guruhlar", icon: UsersRound },
  { href: "/profile", label: "Profil", icon: UserRound },
];

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
