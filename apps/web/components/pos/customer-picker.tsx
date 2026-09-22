"use client";

import { Search, UserPlus, UserRound, X } from "lucide-react";
import { useState } from "react";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { Button } from "@/components/ui/button";
import { useCustomers, type Customer } from "@/hooks/use-customers";

export function CustomerPicker({
  branchId,
  customer,
  onSelect,
}: {
  branchId: string | null;
  customer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: matches } = useCustomers(
    branchId,
    search.length >= 2 ? search : undefined,
  );

  if (customer) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {customer.name ?? customer.phone}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {customer.phone} •{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {customer.loyaltyPoints} pts
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Remove attached customer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Attach customer (name/phone)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-xl border border-border/70 bg-muted/20 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-background focus:outline-hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AddCustomerDialog
        branchId={branchId}
        onCreated={(c) => onSelect(c)}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 shrink-0 gap-1 text-xs font-semibold px-2.5 rounded-xl border-border/80"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        }
      />

      {search.length >= 2 && matches && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-border/80 bg-popover shadow-xl p-1">
          {matches.slice(0, 5).map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-muted transition-colors"
              onClick={() => {
                onSelect(m);
                setSearch("");
              }}
            >
              <div>
                <p className="font-semibold text-foreground">
                  {m.name ?? "Unnamed Customer"}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.phone}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {m.loyaltyPoints} pts
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
