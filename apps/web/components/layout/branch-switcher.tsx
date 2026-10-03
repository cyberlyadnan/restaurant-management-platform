"use client";

import { Check, ChevronsUpDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/hooks/use-branch";
import { cn } from "@/lib/utils";

export function BranchSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { branchId, branches, setBranchId } = useBranch();
  const current = branches.find((b) => b.id === branchId);

  if (branches.length === 0) return null;

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          title={`Current branch: ${current?.name ?? "Select branch"}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground transition-all mx-auto shadow-2xs"
        >
          <Store className="h-4 w-4 text-indigo-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {branches.map((branch) => (
            <DropdownMenuItem key={branch.id} onClick={() => setBranchId(branch.id)}>
              <span className="flex-1">{branch.name}</span>
              {branch.id === branchId && <Check className="h-4 w-4 text-indigo-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar px-3 py-2 text-left text-sm hover:bg-sidebar-accent/70 transition-all shadow-2xs">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          <Store className="h-3.5 w-3.5" />
        </div>
        <span className="flex-1 truncate font-semibold text-sidebar-foreground text-xs">
          {current?.name ?? "Select branch"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {branches.map((branch) => (
          <DropdownMenuItem key={branch.id} onClick={() => setBranchId(branch.id)}>
            <span className="flex-1 font-medium">{branch.name}</span>
            {branch.id === branchId && <Check className="h-4 w-4 text-indigo-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
