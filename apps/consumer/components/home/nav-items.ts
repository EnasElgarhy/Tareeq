import { Compass, House, Sparkles, UserRound } from "lucide-react";
import type { ComponentType } from "react";
import type { StringKey } from "@/lib/i18n/strings";

export interface NavItem {
  labelKey: StringKey;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Extra pathnames that should also light this tab (e.g. preview routes). */
  alsoActiveOn?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "home.tab.overview", href: "/home", icon: House, alsoActiveOn: ["/home-preview"] },
  { labelKey: "home.explore.title", href: "/explore", icon: Compass },
  { labelKey: "home.tab.kai", href: "/kai", icon: Sparkles },
  { labelKey: "home.you.title", href: "/you", icon: UserRound },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || (item.alsoActiveOn?.includes(pathname) ?? false);
}
