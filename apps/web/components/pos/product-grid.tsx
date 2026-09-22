"use client";

import {
  Flame,
  Minus,
  Plus,
  Search,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DietaryBadge } from "@/components/pos/dietary-badge";
import type { CartLine } from "@/components/pos/cart-line";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useMenuItems, type MenuItem } from "@/hooks/use-menu";
import { formatCurrency } from "@/lib/format";

interface ProductGridProps {
  branchId: string | null;
  onSelect: (item: MenuItem) => void;
  cartLines?: CartLine[];
  onIncrement?: (item: MenuItem) => void;
  onDecrement?: (item: MenuItem) => void;
}

export function ProductGrid({
  branchId,
  onSelect,
  cartLines = [],
  onIncrement,
  onDecrement,
}: ProductGridProps) {
  const { data: categories } = useCategories(branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "COMBOS">("ALL");

  const { data: items, isLoading } = useMenuItems(branchId, activeCategoryId);

  // Map item IDs to their total count currently in cart
  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cartLines) {
      map.set(line.menuItemId, (map.get(line.menuItemId) ?? 0) + line.quantity);
    }
    return map;
  }, [cartLines]);

  // Filter items based on search and dietary filter
  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }

      // Dietary filter
      if (dietaryFilter === "VEG" && !item.isVeg) return false;
      if (dietaryFilter === "NON_VEG" && item.isVeg) return false;
      if (dietaryFilter === "COMBOS" && !item.isCombo) return false;

      return true;
    });
  }, [items, search, dietaryFilter]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dishes, drinks, appetizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/70 bg-muted/20 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-background focus:outline-hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dietary Quick Filter Pills (Zomato Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setDietaryFilter("ALL")}
            className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
              dietaryFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === "VEG" ? "ALL" : "VEG")}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
              dietaryFilter === "VEG"
                ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
                : "border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            }`}
          >
            <DietaryBadge isVeg={true} size="sm" />
            <span>Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
              dietaryFilter === "NON_VEG"
                ? "border-rose-500 bg-rose-600 text-white shadow-xs"
                : "border border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            }`}
          >
            <DietaryBadge isVeg={false} size="sm" />
            <span>Non-Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === "COMBOS" ? "ALL" : "COMBOS")}
            className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
              dietaryFilter === "COMBOS"
                ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                : "border border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Combos</span>
          </button>
        </div>
      </div>

      {/* Category Scroll Bar */}
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategoryId(undefined)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategoryId === undefined
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeCategoryId === cat.id
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Dishes Grid */}
      <div className="grid flex-1 auto-rows-min grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 overflow-y-auto pb-4 overscroll-contain">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}

        {filtered?.map((item) => {
          const qty = cartQuantities.get(item.id) ?? 0;
          const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 shadow-xs transition-all hover:shadow-md ${
                qty > 0
                  ? "border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:border-border"
              }`}
            >
              {/* Card Header: Dietary Badge & Tags */}
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <DietaryBadge isVeg={item.isVeg} size="sm" />
                    {item.category?.name && (
                      <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider truncate max-w-[120px]">
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  {item.isCombo && (
                    <span className="flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-2.5 w-2.5" />
                      COMBO
                    </span>
                  )}
                </div>

                {/* Dish Name */}
                <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {item.name}
                </h4>
              </div>

              {/* Card Bottom Row: Price & Zomato-Style ADD / Stepper Button */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-border/40">
                <div>
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {formatCurrency(item.price)}
                  </span>
                  {hasModifiers && (
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Customisable
                    </p>
                  )}
                </div>

                {/* Zomato-Style ADD Button or In-Place Stepper */}
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="relative flex items-center justify-center rounded-xl border-2 border-emerald-600/40 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-700 shadow-xs transition-all hover:bg-emerald-600 hover:text-white active:scale-95 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/40 dark:hover:bg-emerald-600 dark:hover:text-white"
                  >
                    <span>+ ADD</span>
                  </button>
                ) : (
                  <div className="flex items-center rounded-xl border-2 border-primary bg-primary text-primary-foreground shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDecrement) onDecrement(item);
                      }}
                      className="flex h-7 w-7 items-center justify-center hover:bg-black/15 active:scale-90 transition-all text-primary-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-xs font-black tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onIncrement) onIncrement(item);
                        else onSelect(item);
                      }}
                      className="flex h-7 w-7 items-center justify-center hover:bg-black/15 active:scale-90 transition-all text-primary-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered?.length === 0 && !isLoading && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <UtensilsCrossed className="mx-auto h-9 w-9 opacity-30 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              No dishes found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or dietary filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
