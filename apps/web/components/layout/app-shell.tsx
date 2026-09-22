"use client";

import type { SessionUser } from "@nodedr-restaurant/types";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { BrandFooter } from "./brand-footer";
import { BranchSwitcher } from "./branch-switcher";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function AppShell({
  user,
  children,
}: {
  user?: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar - pinned, does not scroll with main content */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex h-dvh max-h-dvh select-none">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Nodedr OrderRestro
          </span>
        </div>
        <div className="shrink-0 px-3 pb-3">
          <BranchSwitcher />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto py-2 overscroll-contain">
          <SidebarNav user={user} />
        </div>
        <div className="shrink-0 mt-auto border-t border-sidebar-border/40">
          <BrandFooter />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex h-full w-72 flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 shrink-0 items-center gap-2 px-5">
            <Logo />
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Nodedr OrderRestro
            </span>
          </div>
          <div className="shrink-0 px-3 pb-3">
            <BranchSwitcher />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 overscroll-contain">
            <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="shrink-0 mt-auto border-t border-sidebar-border/40">
            <BrandFooter />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main page content area - scrolls independently */}
      <div className="flex min-w-0 flex-1 flex-col h-dvh max-h-dvh overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 z-20">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 overscroll-contain">{children}</main>
      </div>
    </div>
  );
}
