"use client";

import {
  AlertCircle,
  ArrowRight,
  Maximize2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { DietaryBadge } from "@/components/pos/dietary-badge";
import type { CartLine } from "@/components/pos/cart-line";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RestaurantTable } from "@/hooks/use-tables";
import { formatCurrency } from "@/lib/format";
import { subtotalOf } from "@/lib/pricing-preview";

export function CartPanel({
  lines,
  orderType,
  onOrderTypeChange,
  tables,
  tableId,
  onTableChange,
  onIncrement,
  onDecrement,
  onRemove,
  onOpenFullCart,
  onSubmit,
  isSubmitting,
  existingOrderNumber,
  onViewExistingOrder,
}: {
  lines: CartLine[];
  orderType: "DINE_IN" | "TAKEAWAY";
  onOrderTypeChange: (type: "DINE_IN" | "TAKEAWAY") => void;
  tables: RestaurantTable[];
  tableId: string;
  onTableChange: (id: string) => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onOpenFullCart?: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  existingOrderNumber?: string;
  onViewExistingOrder?: () => void;
}) {
  const totalQuantity = lines.reduce((acc, l) => acc + l.quantity, 0);
  const subtotal = subtotalOf(lines.map((l) => l.unitPrice * l.quantity));
  const canSubmit = lines.length > 0 && (orderType === "TAKEAWAY" || !!tableId) && !isSubmitting;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Order Type Tabs */}
      <Tabs
        value={orderType}
        onValueChange={(v) => onOrderTypeChange(v as "DINE_IN" | "TAKEAWAY")}
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="DINE_IN" className="text-xs font-semibold">
            Dine-in
          </TabsTrigger>
          <TabsTrigger value="TAKEAWAY" className="text-xs font-semibold">
            Takeaway
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table Selector (Dine-in) */}
      {orderType === "DINE_IN" && (
        <Select value={tableId} onValueChange={(v) => onTableChange(v ?? "")}>
          <SelectTrigger className="w-full h-10 text-xs font-medium">
            <SelectValue placeholder="Select table">
              {(value: string | null) => {
                const t = tables.find((table) => table.id === value);
                if (!t) return "Select table";
                return `${t.name ?? `Table ${t.number}`}${t.status === "OCCUPIED" ? " (occupied)" : ""}`;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.name ?? `Table ${t.number}`} {t.status === "OCCUPIED" ? "(occupied)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Open Order Notice */}
      {existingOrderNumber && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs text-blue-700 dark:text-blue-300">
          <div className="min-w-0">
            <p className="font-semibold truncate">Active Order #{existingOrderNumber}</p>
            <p className="text-[11px] opacity-80">New items fire as Round 2</p>
          </div>
          {onViewExistingOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 shrink-0 px-2 text-[11px] border-blue-500/30"
              onClick={onViewExistingOrder}
            >
              View Bill
            </Button>
          )}
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground/60">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Cart is empty</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Click <strong className="text-primary">+ ADD</strong> on any dish to start the order
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {lines.map((line) => (
              <div key={line.key} className="flex items-start justify-between gap-2.5 py-2.5">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className="mt-0.5">
                    <DietaryBadge isVeg={line.isVeg ?? true} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{line.name}</p>
                    {line.modifierLabel && (
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        {line.modifierLabel}
                      </p>
                    )}
                    <p className="text-xs font-semibold tabular-nums text-foreground mt-0.5">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => onDecrement(line.key)}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(line.key)}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(line.key)}
                    className="p-1 text-muted-foreground/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary & Action Buttons */}
      <div className="flex flex-col gap-2.5 border-t border-border/70 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Total ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
          </span>
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* View Full Cart Button (Opens Modal) */}
        {onOpenFullCart && lines.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenFullCart}
            className="h-10 w-full rounded-xl border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>View Full Cart ({totalQuantity})</span>
          </Button>
        )}

        {/* Fire to Kitchen Button */}
        <Button
          className="h-11 w-full rounded-xl font-bold text-xs sm:text-sm bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {isSubmitting
            ? "Sending to kitchen…"
            : existingOrderNumber
              ? `Add & Send to Kitchen`
              : "Send to Kitchen (KOT)"}
        </Button>
      </div>
    </div>
  );
}
