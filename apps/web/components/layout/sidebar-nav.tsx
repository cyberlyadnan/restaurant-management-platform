"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@nodedr-restaurant/types";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({
  user,
  collapsed = false,
  onNavigate,
}: {
  user?: SessionUser;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.permission || user?.permissions.includes(item.permission)
  );

  return (
    <nav className={cn("flex flex-col gap-1.5", collapsed ? "px-2" : "px-3")}>
      {filteredItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 select-none",
              collapsed ? "h-10 w-10 justify-center mx-auto" : "gap-3 px-3 py-2.5",
              isActive
                ? "bg-indigo-500/15 text-indigo-400 font-bold shadow-2xs border-l-2 border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:translate-x-0.5"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-indigo-500 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
              )}
              strokeWidth={isActive ? 2.3 : 1.9}
            />

            {!collapsed && (
              <span className="flex-1 truncate tracking-tight text-[13px]">{item.label}</span>
            )}

            {/* Active Pill Indicator for Collapsed Mode */}
            {collapsed && isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500 shadow-xs" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
