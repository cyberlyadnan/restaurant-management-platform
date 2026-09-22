"use client";

import type { SessionUser } from "@nodedr-restaurant/types";
import {
  ChefHat,
  Clock,
  Menu,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "./global-search";
import { UserMenu } from "./user-menu";

interface TopHeaderProps {
  user?: SessionUser;
  onOpenMobileMenu: () => void;
}

export function TopHeader({ user, onOpenMobileMenu }: TopHeaderProps) {
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  const isPos = pathname?.startsWith("/pos");
  const isKds = pathname?.startsWith("/kds");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-card/75 px-3 sm:px-5 backdrop-blur-md transition-colors shadow-xs">
      {/* Left: Mobile Drawer Trigger & Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2 sm:mr-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar (with ⌘K shortcut palette) */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <GlobalSearch />
        </div>
      </div>

      {/* Right: Status, Quick Shortcuts, Notifications, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Live Service Status Pill (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="tracking-tight text-[11px] font-semibold uppercase">
            Service Active
          </span>
        </div>

        {/* Live Shift Clock (Desktop) */}
        {time && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{time}</span>
          </div>
        )}

        {/* Quick Launch: POS Register (Desktop) */}
        <Link
          href="/pos"
          className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
            isPos
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
          }`}
          title="Quick launch Point of Sale"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>POS</span>
        </Link>

        {/* Quick Launch: Kitchen Display (Desktop) */}
        <Link
          href="/kds"
          className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
            isKds
              ? "border-orange-500 bg-orange-500 text-white shadow-xs"
              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-orange-500/40 hover:bg-muted/60 hover:text-foreground"
          }`}
          title="Quick launch Kitchen Display System"
        >
          <ChefHat className="h-3.5 w-3.5 text-orange-500" />
          <span>KDS</span>
        </Link>

        {/* Separator */}
        <div className="hidden sm:block h-5 w-px bg-border/80 mx-0.5" />

        {/* Real-time Notification Bell */}
        <NotificationBell />

        {/* User Profile & Theme Switcher */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
