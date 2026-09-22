"use client";

import type { SessionUser } from "@nodedr-restaurant/types";
import { ChevronDown, LogOut, Moon, Settings, Sun, UserCheck, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-auth";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user?: SessionUser }) {
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const router = useRouter();

  const roleColor =
    user?.roleName?.toLowerCase().includes("owner") ||
    user?.roleName?.toLowerCase().includes("admin")
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : user?.roleName?.toLowerCase().includes("chef") ||
          user?.roleName?.toLowerCase().includes("kitchen")
        ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20"
        : user?.roleName?.toLowerCase().includes("waiter")
          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
          : "bg-primary/15 text-primary border-primary/20";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground hover:border-primary/30"
        aria-label="Toggle theme"
        title="Toggle dark / light theme"
      >
        <Sun className="h-4 w-4 dark:hidden text-amber-500" />
        <Moon className="hidden h-4 w-4 dark:block text-blue-400" />
      </button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="group flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-2 py-1.5 transition-all hover:bg-muted/60 hover:border-primary/30 outline-hidden">
          <div className="relative">
            <Avatar className="h-7 w-7 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
              <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div className="hidden text-left sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">
                {user?.name}
              </span>
              {user?.roleName && (
                <span
                  className={`rounded border px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider ${roleColor}`}
                >
                  {user.roleName}
                </span>
              )}
            </div>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 shadow-xl">
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleColor}`}
                  >
                    {user?.roleName || "Staff"}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={() => router.push("/settings/staff")}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <UsersRound className="h-3.5 w-3.5 text-primary" />
            <span>Staff & Users</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5 text-primary" />
            <span>System Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

