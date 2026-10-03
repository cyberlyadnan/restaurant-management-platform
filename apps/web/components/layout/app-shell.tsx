"use client";

import type { SessionUser } from "@nodedr-restaurant/types";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandFooter } from "./brand-footer";
import { BranchSwitcher } from "./branch-switcher";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { SubscriptionBanner } from "./subscription-banner";
import { TopHeader } from "./top-header";

export function AppShell({
  user,
  children,
}: {
  user?: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar - smooth collapse/expand animation */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/95 backdrop-blur-xl lg:flex h-dvh max-h-dvh select-none transition-all duration-300 ease-in-out shadow-xs",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header Branding & Toggle Button */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border/40 px-3.5",
            collapsed ? "justify-center gap-0" : "justify-between"
          )}
        >
          <Logo collapsed={collapsed} />

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/80 bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all shadow-2xs hover:scale-105 active:scale-95"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-indigo-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Branch Switcher */}
        <div className={cn("shrink-0 py-3", collapsed ? "px-2" : "px-3")}>
          <BranchSwitcher collapsed={collapsed} />
        </div>

        {/* Main Navigation Items */}
        <div className="flex-1 min-h-0 overflow-y-auto py-1 overscroll-contain">
          <SidebarNav user={user} collapsed={collapsed} />
        </div>

        {/* Brand Footer */}
        <div className="shrink-0 mt-auto">
          <BrandFooter collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex h-full w-72 flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/40 px-5">
            <Logo />
          </div>
          <div className="shrink-0 px-3 py-3">
            <BranchSwitcher />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 overscroll-contain">
            <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="shrink-0 mt-auto">
            <BrandFooter />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main page content area - scrolls independently */}
      <div className="flex min-w-0 flex-1 flex-col h-dvh max-h-dvh overflow-hidden">
        <TopHeader user={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <SubscriptionBanner />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
