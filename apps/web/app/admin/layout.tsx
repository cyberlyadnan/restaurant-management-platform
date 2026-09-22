"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformLogout, usePlatformMe } from "@/hooks/use-platform";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Restaurants", href: "/admin/restaurants", icon: UtensilsCrossed },
  { label: "Plans", href: "/admin/plans", icon: Layers },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CalendarClock },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
];

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading, isError } = usePlatformMe();
  const logoutMutation = usePlatformLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Allow login page to render without layout guards
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage && !isLoading && (isError || !data?.user)) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, isLoading, isError, data, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">
            Loading Platform Console...
          </span>
        </div>
      </div>
    );
  }

  if (isError || !data?.user) {
    return null;
  }

  const user = data.user;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/admin/login");
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">
              OrderRestro
            </div>
            <div className="text-[11px] font-medium text-emerald-400 tracking-wider uppercase">
              Platform Admin
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-emerald-400" : "text-slate-500"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <Store className="h-4 w-4 text-slate-500" />
          <span>Switch to Restaurant App</span>
        </Link>

        <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2.5 border border-slate-800/80">
          <div className="min-w-0 flex-1 pr-2">
            <div className="truncate text-xs font-semibold text-slate-200">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-slate-400">
              {user.email}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Log out of platform"
            className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-md lg:block fixed inset-y-0 left-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-full bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col z-10">
            <div className="p-3 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex h-14 items-center justify-between border-b border-slate-800 px-4 bg-slate-950">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Platform Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
